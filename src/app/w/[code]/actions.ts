"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { effectiveStatus } from "@/lib/boards";
import { LIMITS } from "@/lib/domain";
import { containsBannedWord } from "@/lib/moderation";
import { deviceHash, ensureDeviceId, requestIpHash } from "@/lib/server/device";
import { forgetMyMessage, rememberMyMessage } from "@/lib/server/my-messages";
import { getBoardByJoinCode } from "@/lib/server/public-boards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BoardRow } from "@/lib/types";
import { bodySchema, messageSchema, passwordSchema, type MessageInput } from "@/lib/validation";
import { isVariantKey } from "@/lib/variants";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; field?: string };

const GENERIC_ERROR = "잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요.";
const BANNED_ERROR = "고운 말로 다시 적어 주세요. 사용할 수 없는 표현이 들어 있어요.";

/** 참여자가 쓸 수 있는 보드인지 */
async function writableBoard(code: string): Promise<{ board: BoardRow } | { error: string }> {
  const board = await getBoardByJoinCode(code);
  if (!board) return { error: "보드를 찾을 수 없어요." };
  if (effectiveStatus(board) !== "collecting") return { error: "마감된 보드예요. 더 이상 메시지를 받지 않아요." };
  return { board };
}

// ─────────────────────────────────────────────
// 작성
// ─────────────────────────────────────────────
export async function createMessage(code: string, input: MessageInput): Promise<ActionResult> {
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: String(issue.path[0]) };
  }
  const v = parsed.data;

  const found = await writableBoard(code);
  if ("error" in found) return { ok: false, error: found.error };
  const { board } = found;

  if (!isVariantKey(board.theme, v.variant)) return { ok: false, error: "꾸밈을 다시 골라 주세요.", field: "variant" };
  if (containsBannedWord(v.nickname)) return { ok: false, error: BANNED_ERROR, field: "nickname" };
  if (containsBannedWord(v.body)) return { ok: false, error: BANNED_ERROR, field: "body" };

  const admin = createAdminClient();
  const deviceId = await ensureDeviceId();
  const clientHash = deviceHash(deviceId);
  const ipHash = await requestIpHash();

  try {
    // 같은 기기: 연속 작성 간격, 하루 개수
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: mine, error: mineErr } = await admin
      .from("messages")
      .select("created_at")
      .eq("board_id", board.id)
      .eq("client_hash", clientHash)
      .gte("created_at", dayAgo)
      .order("created_at", { ascending: false })
      .limit(LIMITS.devicePerDay);
    if (mineErr) throw mineErr;
    if (mine?.length) {
      const sinceLast = (Date.now() - Date.parse(mine[0].created_at)) / 1000;
      if (sinceLast < LIMITS.deviceCooldownSec) {
        return { ok: false, error: `조금 전에 메시지를 남겼어요. ${Math.ceil(LIMITS.deviceCooldownSec - sinceLast)}초 뒤에 다시 시도해 주세요.` };
      }
      if (mine.length >= LIMITS.devicePerDay) {
        return { ok: false, error: `한 기기에서는 하루 ${LIMITS.devicePerDay}개까지 남길 수 있어요.` };
      }
    }

    // 같은 네트워크: 한 시간 개수
    if (ipHash) {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count, error } = await admin
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("board_id", board.id)
        .eq("ip_hash", ipHash)
        .gte("created_at", hourAgo);
      if (error) throw error;
      if ((count ?? 0) >= LIMITS.ipPerHour) {
        return { ok: false, error: "지금 이 네트워크에서 메시지가 너무 많이 올라왔어요. 잠시 뒤에 다시 시도해 주세요." };
      }
    }

    const { data, error } = await admin
      .from("messages")
      .insert({
        board_id: board.id,
        nickname: v.nickname,
        body: v.body,
        style: { variant: v.variant },
        password_hash: await hash(v.password, 10),
        status: board.opt_require_approval ? "pending" : "visible",
        client_hash: clientHash,
        ip_hash: ipHash,
      })
      .select("id")
      .single();
    if (error) throw error;

    await rememberMyMessage(board.id, code, data.id);
    revalidatePath(`/w/${code}`);
    redirect(`/w/${code}/done?m=${data.id}`);
  } catch (e) {
    if (isRedirect(e)) throw e;
    console.error("createMessage failed", e);
    return { ok: false, error: GENERIC_ERROR };
  }
}

// ─────────────────────────────────────────────
// 비밀번호 확인 (수정·삭제·찾기 공통)
// ─────────────────────────────────────────────
type OwnedMessage = { id: string; board_id: string; nickname: string; body: string; status: string };

async function verifyPassword(
  boardId: string,
  messageId: string,
  password: string,
): Promise<{ ok: true; message: OwnedMessage } | { ok: false; error: string }> {
  if (!passwordSchema.safeParse(password).success) return { ok: false, error: "숫자 4자리를 입력해 주세요." };
  if (!/^[0-9a-f-]{36}$/.test(messageId)) return { ok: false, error: "메시지를 찾을 수 없어요." };

  const admin = createAdminClient();
  const { data: m, error } = await admin
    .from("messages")
    .select("id, board_id, nickname, body, status, password_hash, pw_fail_count, pw_locked_until")
    .eq("id", messageId)
    .maybeSingle();
  if (error) {
    console.error("verifyPassword failed", error);
    return { ok: false, error: GENERIC_ERROR };
  }
  if (!m || m.board_id !== boardId) return { ok: false, error: "메시지를 찾을 수 없어요." };

  if (m.pw_locked_until && Date.parse(m.pw_locked_until) > Date.now()) {
    return { ok: false, error: lockedMessage(m.pw_locked_until) };
  }

  if (await compare(password, m.password_hash)) {
    if (m.pw_fail_count > 0 || m.pw_locked_until) {
      await admin.from("messages").update({ pw_fail_count: 0, pw_locked_until: null }).eq("id", m.id);
    }
    return { ok: true, message: { id: m.id, board_id: m.board_id, nickname: m.nickname, body: m.body, status: m.status } };
  }

  const { data: fail, error: rpcErr } = await admin.rpc("mm_password_failed", {
    p_message_id: m.id,
    p_max: LIMITS.passwordMaxTries,
    p_lock_minutes: LIMITS.passwordLockMinutes,
  });
  if (rpcErr) console.error("mm_password_failed failed", rpcErr);
  const row = (Array.isArray(fail) ? fail[0] : fail) as { locked_until: string | null; remaining: number } | undefined;
  if (row?.locked_until) return { ok: false, error: lockedMessage(row.locked_until) };
  return { ok: false, error: `비밀번호가 맞지 않아요.${row ? ` 남은 시도 ${row.remaining}회` : ""}` };
}

function lockedMessage(until: string) {
  const min = Math.max(1, Math.ceil((Date.parse(until) - Date.now()) / 60000));
  return `비밀번호를 ${LIMITS.passwordMaxTries}번 틀려서 잠겼어요. ${min}분 뒤에 다시 시도해 주세요.`;
}

/** 수정 전에 비밀번호를 확인하고 지금 내용을 돌려준다 */
export async function checkMessagePassword(
  code: string,
  messageId: string,
  password: string,
): Promise<ActionResult<{ body: string }>> {
  const found = await writableBoard(code);
  if ("error" in found) return { ok: false, error: found.error };
  const r = await verifyPassword(found.board.id, messageId, password);
  if (!r.ok) return r;
  return { ok: true, data: { body: r.message.body } };
}

export async function editMessage(
  code: string,
  messageId: string,
  password: string,
  body: string,
): Promise<ActionResult> {
  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) return { ok: false, error: parsedBody.error.issues[0].message, field: "body" };
  if (containsBannedWord(parsedBody.data)) return { ok: false, error: BANNED_ERROR, field: "body" };

  const found = await writableBoard(code);
  if ("error" in found) return { ok: false, error: found.error };
  const r = await verifyPassword(found.board.id, messageId, password);
  if (!r.ok) return r;

  // 승인 후 게시 보드에서는 고친 내용도 개설자가 다시 확인한다
  const status = found.board.opt_require_approval && r.message.status === "visible" ? "pending" : r.message.status;
  const { error } = await createAdminClient()
    .from("messages")
    .update({ body: parsedBody.data, status })
    .eq("id", messageId);
  if (error) {
    console.error("editMessage failed", error);
    return { ok: false, error: GENERIC_ERROR };
  }
  revalidatePath(`/w/${code}`, "layout");
  return { ok: true };
}

export async function deleteMessage(code: string, messageId: string, password: string): Promise<ActionResult> {
  const found = await writableBoard(code);
  if ("error" in found) return { ok: false, error: found.error };
  const r = await verifyPassword(found.board.id, messageId, password);
  if (!r.ok) return r;

  const { error } = await createAdminClient().from("messages").delete().eq("id", messageId);
  if (error) {
    console.error("deleteMessage failed", error);
    return { ok: false, error: GENERIC_ERROR };
  }
  await forgetMyMessage(found.board.id, code, messageId);
  revalidatePath(`/w/${code}`, "layout");
  return { ok: true };
}

/** 다른 기기에서 쓴 메시지 찾기: 이름 + 비밀번호 */
export async function findMyMessage(code: string, nickname: string, password: string): Promise<ActionResult> {
  const board = await getBoardByJoinCode(code);
  if (!board) return { ok: false, error: "보드를 찾을 수 없어요." };
  const name = nickname.trim();
  if (!name) return { ok: false, error: "작성할 때 쓴 이름을 입력해 주세요.", field: "nickname" };
  if (!passwordSchema.safeParse(password).success) return { ok: false, error: "숫자 4자리를 입력해 주세요.", field: "password" };

  const { data: candidates, error } = await createAdminClient()
    .from("messages")
    .select("id")
    .eq("board_id", board.id)
    .eq("nickname", name)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) {
    console.error("findMyMessage failed", error);
    return { ok: false, error: GENERIC_ERROR };
  }
  if (!candidates?.length) return { ok: false, error: "그 이름으로 남긴 메시지가 없어요." };

  let lastError = "";
  for (const c of candidates) {
    const r = await verifyPassword(board.id, c.id, password);
    if (r.ok) {
      await rememberMyMessage(board.id, code, c.id);
      revalidatePath(`/w/${code}/mine`);
      return { ok: true };
    }
    lastError = r.error;
  }
  return { ok: false, error: lastError || "비밀번호가 맞지 않아요." };
}

function isRedirect(e: unknown): boolean {
  return typeof e === "object" && e !== null && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
}
