"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { newGiftCode } from "@/lib/codes";
import { LIMITS } from "@/lib/domain";
import { deadlineFromDate, kstLocalToIso } from "@/lib/date";
import { BOARD_COLUMNS } from "@/lib/server/boards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { BoardRow } from "@/lib/types";
import { bodySchema, deadlineDateSchema, settingsSchema, type SettingsInput } from "@/lib/validation";

/**
 * 개설자 관리 액션. 쓰기는 모두 service role 로 하되,
 * 먼저 getUser() 로 확인한 사용자가 이 보드의 owner_id 인지 확인한다.
 */
export type ManageResult = { ok: true } | { ok: false; error: string };

const GENERIC = "잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요.";
const UUID = /^[0-9a-f-]{36}$/;

async function requireOwner(boardId: string): Promise<{ board: BoardRow } | { error: string }> {
  if (!UUID.test(boardId)) return { error: "보드를 찾을 수 없어요." };
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) return { error: "로그인이 필요해요. 다시 로그인해 주세요." };
  const { data, error } = await createAdminClient().from("boards").select(BOARD_COLUMNS).eq("id", boardId).maybeSingle();
  if (error) {
    console.error("requireOwner failed", error);
    return { error: GENERIC };
  }
  const board = data as BoardRow | null;
  if (!board || board.owner_id !== user.id) return { error: "보드를 찾을 수 없어요." };
  return { board };
}

function refresh(board: BoardRow) {
  revalidatePath(`/boards/${board.id}`, "layout");
  revalidatePath(`/w/${board.join_code}`, "layout");
  if (board.gift_code) revalidatePath(`/g/${board.gift_code}`);
  revalidatePath("/me");
}

async function updateBoard(board: BoardRow, patch: Partial<BoardRow>): Promise<ManageResult> {
  const { error } = await createAdminClient().from("boards").update(patch).eq("id", board.id);
  if (error) {
    console.error("updateBoard failed", error);
    return { ok: false, error: GENERIC };
  }
  refresh({ ...board, ...patch });
  return { ok: true };
}

/** 선물 코드가 없으면 만든다 (겹치면 다시) */
async function ensureGiftCode(board: BoardRow): Promise<string | null> {
  if (board.gift_code) return board.gift_code;
  const admin = createAdminClient();
  for (let i = 0; i < 3; i++) {
    const code = newGiftCode();
    const { error } = await admin.from("boards").update({ gift_code: code }).eq("id", board.id).is("gift_code", null);
    if (!error) {
      const { data } = await admin.from("boards").select("gift_code").eq("id", board.id).single();
      return (data?.gift_code as string | null) ?? null;
    }
    if (error.code !== "23505") {
      console.error("ensureGiftCode failed", error);
      return null;
    }
  }
  return null;
}

// ─────────────────────────────────────────────
// 메시지 관리
// ─────────────────────────────────────────────
async function messageOf(board: BoardRow, messageId: string): Promise<boolean> {
  if (!UUID.test(messageId)) return false;
  const { data } = await createAdminClient().from("messages").select("id").eq("id", messageId).eq("board_id", board.id).maybeSingle();
  return !!data;
}

export async function ownerEditMessage(boardId: string, messageId: string, body: string): Promise<ManageResult> {
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const r = await requireOwner(boardId);
  if ("error" in r) return { ok: false, error: r.error };
  if (!(await messageOf(r.board, messageId))) return { ok: false, error: "메시지를 찾을 수 없어요." };
  const { error } = await createAdminClient()
    .from("messages")
    .update({ body: parsed.data, edited_by_owner: true })
    .eq("id", messageId)
    .eq("board_id", boardId);
  if (error) {
    console.error("ownerEditMessage failed", error);
    return { ok: false, error: GENERIC };
  }
  refresh(r.board);
  return { ok: true };
}

export async function ownerSetMessageStatus(
  boardId: string,
  messageId: string,
  status: "visible" | "hidden",
): Promise<ManageResult> {
  if (status !== "visible" && status !== "hidden") return { ok: false, error: GENERIC };
  const r = await requireOwner(boardId);
  if ("error" in r) return { ok: false, error: r.error };
  const { error, count } = await createAdminClient()
    .from("messages")
    .update({ status }, { count: "exact" })
    .eq("id", messageId)
    .eq("board_id", boardId);
  if (error || !count) {
    if (error) console.error("ownerSetMessageStatus failed", error);
    return { ok: false, error: "메시지를 찾을 수 없어요." };
  }
  refresh(r.board);
  return { ok: true };
}

export async function ownerDeleteMessage(boardId: string, messageId: string): Promise<ManageResult> {
  const r = await requireOwner(boardId);
  if ("error" in r) return { ok: false, error: r.error };
  const { error } = await createAdminClient().from("messages").delete().eq("id", messageId).eq("board_id", boardId);
  if (error) {
    console.error("ownerDeleteMessage failed", error);
    return { ok: false, error: GENERIC };
  }
  refresh(r.board);
  return { ok: true };
}

/** 확인 대기 메시지를 한꺼번에 승인 */
export async function ownerApproveAll(boardId: string): Promise<ManageResult> {
  const r = await requireOwner(boardId);
  if ("error" in r) return { ok: false, error: r.error };
  const { error } = await createAdminClient().from("messages").update({ status: "visible" }).eq("board_id", boardId).eq("status", "pending");
  if (error) {
    console.error("ownerApproveAll failed", error);
    return { ok: false, error: GENERIC };
  }
  refresh(r.board);
  return { ok: true };
}

// ─────────────────────────────────────────────
// 설정, 마감, 전달
// ─────────────────────────────────────────────
export async function updateSettings(boardId: string, input: SettingsInput): Promise<ManageResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC };
  const v = parsed.data;
  const r = await requireOwner(boardId);
  if ("error" in r) return { ok: false, error: r.error };
  const { board } = r;

  // 전달 뒤에는 결과 공개 여부만 바꿀 수 있다
  if (board.status === "delivered") {
    return updateBoard(board, { opt_public_result: v.optPublicResult });
  }

  // 서프라이즈를 끄면 주인공이 실시간으로 볼 수 있도록 선물 링크를 바로 만든다
  if (!v.optSurprise && !board.gift_code) {
    const code = await ensureGiftCode(board);
    if (!code) return { ok: false, error: GENERIC };
    board.gift_code = code;
  }
  return updateBoard(board, {
    opt_preview_messages: v.optPreviewMessages,
    opt_require_approval: v.optRequireApproval,
    opt_surprise: v.optSurprise,
    opt_public_result: v.optPublicResult,
  });
}

export async function closeBoard(boardId: string): Promise<ManageResult> {
  const r = await requireOwner(boardId);
  if ("error" in r) return { ok: false, error: r.error };
  if (r.board.status !== "collecting") return { ok: false, error: "이미 마감된 보드예요." };
  return updateBoard(r.board, { status: "closed" });
}

/** 마감 연장 (마감된 보드는 다시 모으기 시작) */
export async function extendDeadline(boardId: string, date: string): Promise<ManageResult> {
  const parsed = deadlineDateSchema.safeParse(date);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const r = await requireOwner(boardId);
  if ("error" in r) return { ok: false, error: r.error };
  if (r.board.status === "delivered") return { ok: false, error: "이미 전달한 보드예요." };
  return updateBoard(r.board, { deadline_at: deadlineFromDate(parsed.data), status: "collecting" });
}

/**
 * 전달하기: 보드를 마감하고 선물 링크를 확정한다.
 * revealAtLocal(KST 'YYYY-MM-DDTHH:mm')을 주면 그 시각부터 열린다 (서프라이즈 보드만).
 */
export async function deliverBoard(boardId: string, revealAtLocal: string | null): Promise<ManageResult> {
  const r = await requireOwner(boardId);
  if ("error" in r) return { ok: false, error: r.error };
  const { board } = r;
  if (board.status === "delivered") return { ok: false, error: "이미 전달한 보드예요." };

  let revealAt: string | null = null;
  if (revealAtLocal) {
    if (!board.opt_surprise) return { ok: false, error: "서프라이즈 모드가 꺼진 보드는 바로 공개돼요." };
    revealAt = kstLocalToIso(revealAtLocal);
    if (!revealAt) return { ok: false, error: "공개 시각을 다시 골라 주세요." };
    const t = Date.parse(revealAt);
    if (t < Date.now() + 5 * 60 * 1000) return { ok: false, error: "공개 시각은 지금부터 5분 뒤 이후로 골라 주세요." };
    if (t > Date.now() + LIMITS.revealMaxDays * 24 * 60 * 60 * 1000) {
      return { ok: false, error: `공개 시각은 ${LIMITS.revealMaxDays}일 이내로 골라 주세요.` };
    }
  }

  const code = await ensureGiftCode(board);
  if (!code) return { ok: false, error: GENERIC };
  return updateBoard({ ...board, gift_code: code }, {
    status: "delivered",
    delivered_at: new Date().toISOString(),
    reveal_at: revealAt,
  });
}

/** 예약 공개를 지금 바로 열기 */
export async function revealNow(boardId: string): Promise<ManageResult> {
  const r = await requireOwner(boardId);
  if ("error" in r) return { ok: false, error: r.error };
  if (r.board.status !== "delivered") return { ok: false, error: "아직 전달하지 않은 보드예요." };
  return updateBoard(r.board, { reveal_at: null });
}

export async function deleteBoard(boardId: string): Promise<ManageResult> {
  const r = await requireOwner(boardId);
  if ("error" in r) return { ok: false, error: r.error };
  const { error } = await createAdminClient().from("boards").delete().eq("id", boardId);
  if (error) {
    console.error("deleteBoard failed", error);
    return { ok: false, error: GENERIC };
  }
  revalidatePath("/me");
  redirect("/me");
}
