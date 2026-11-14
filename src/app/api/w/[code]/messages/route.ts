import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { effectiveStatus } from "@/lib/boards";
import { containsBlockedWord } from "@/lib/moderation";
import { isValidVariant } from "@/lib/theme-styles";
import { createMessageSchema } from "@/lib/validation";
import { jsonError, notConfigured, parseBody } from "@/lib/server/api";
import { clientHash } from "@/lib/server/client-hash";
import { getBoardByJoinCode } from "@/lib/server/public-boards";
import { createAdminClient } from "@/lib/supabase/admin";

/** 같은 기기에서: 15초 안에 다시 쓰기 금지, 1시간에 5개까지 */
const MIN_INTERVAL_MS = 15_000;
const MAX_PER_HOUR = 5;

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const nc = notConfigured();
  if (nc) return nc;

  const { code } = await params;
  const board = await getBoardByJoinCode(code);
  if (!board) return jsonError(404, "보드를 찾을 수 없어요.");
  if (effectiveStatus(board) !== "collecting") return jsonError(409, "마감된 보드예요. 더 이상 메시지를 남길 수 없어요.");

  const parsed = await parseBody(request, createMessageSchema);
  if (!parsed.ok) return parsed.response;
  const { nickname, body, variant, password } = parsed.data;

  if (!isValidVariant(board.theme, variant)) return jsonError(400, "꾸미기 선택이 올바르지 않아요.");
  if (containsBlockedWord(nickname, body)) {
    return jsonError(422, "응원과 어울리지 않는 표현이 있어요. 조금만 다듬어 주세요.");
  }

  const admin = createAdminClient();
  const ch = clientHash(request, board.id);

  // 연속 작성 제한
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recent } = await admin
    .from("messages")
    .select("created_at")
    .eq("board_id", board.id)
    .eq("client_hash", ch)
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  if (recent?.length) {
    if (Date.now() - Date.parse(recent[0].created_at) < MIN_INTERVAL_MS) {
      return jsonError(429, "조금 전에 남기셨어요. 잠시 후 다시 시도해 주세요.");
    }
    if (recent.length >= MAX_PER_HOUR) {
      return jsonError(429, "이 기기에서 너무 많이 남겼어요. 1시간 뒤에 다시 시도해 주세요.");
    }
  }

  const { data: inserted, error } = await admin
    .from("messages")
    .insert({
      board_id: board.id,
      nickname,
      body,
      style: { variant },
      password_hash: await hash(password, 10),
      status: board.opt_require_approval ? "pending" : "visible",
      client_hash: ch,
    })
    .select("id, created_at, status")
    .single();

  if (error || !inserted) {
    console.error("create message failed", error);
    return jsonError(500, "메시지를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }

  // 몇 번째 참여인지 (숨김 제외)
  const { count } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("board_id", board.id)
    .in("status", ["visible", "pending"])
    .lte("created_at", inserted.created_at);

  return NextResponse.json(
    { id: inserted.id, ordinal: count ?? 1, pending: inserted.status === "pending" },
    { status: 201 },
  );
}
