import { NextResponse } from "next/server";
import { containsBlockedWord } from "@/lib/moderation";
import { isValidVariant } from "@/lib/theme-styles";
import { passwordOnlySchema, updateMessageSchema } from "@/lib/validation";
import { jsonError, notConfigured, parseBody } from "@/lib/server/api";
import { authorizeMessage } from "@/lib/server/message-auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** 참여자 본인 수정 (비밀번호 확인) */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const nc = notConfigured();
  if (nc) return nc;
  const { id } = await params;

  const parsed = await parseBody(request, updateMessageSchema);
  if (!parsed.ok) return parsed.response;
  const { password, nickname, body, variant } = parsed.data;

  const auth = await authorizeMessage(id, password);
  if (!auth.ok) return jsonError(auth.status, auth.error);

  if (variant && !isValidVariant(auth.board.theme, variant)) return jsonError(400, "꾸미기 선택이 올바르지 않아요.");
  if (containsBlockedWord(nickname ?? "", body ?? "")) {
    return jsonError(422, "응원과 어울리지 않는 표현이 있어요. 조금만 다듬어 주세요.");
  }

  const patch: Record<string, unknown> = {};
  if (nickname !== undefined) patch.nickname = nickname;
  if (body !== undefined) patch.body = body;
  if (variant !== undefined) patch.style = { variant };
  if (!Object.keys(patch).length) return jsonError(400, "바꿀 내용이 없어요.");

  // 승인 후 게시 보드에서 이미 공개된 글을 고치면 다시 승인을 받게 한다 (공개 후 내용 바꿔치기 방지).
  // 개설자가 숨긴 글은 숨김 상태를 유지한다.
  if (auth.board.opt_require_approval && auth.message.status === "visible") patch.status = "pending";

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("messages")
    .update(patch)
    .eq("id", id)
    .select("id, nickname, body, style, status")
    .single();
  if (error) {
    console.error("update message failed", error);
    return jsonError(500, "수정하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
  return NextResponse.json({ message: data });
}

/** 참여자 본인 삭제 (비밀번호 확인) */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const nc = notConfigured();
  if (nc) return nc;
  const { id } = await params;

  const parsed = await parseBody(request, passwordOnlySchema);
  if (!parsed.ok) return parsed.response;

  const auth = await authorizeMessage(id, parsed.data.password);
  if (!auth.ok) return jsonError(auth.status, auth.error);

  const admin = createAdminClient();
  const { error } = await admin.from("messages").delete().eq("id", id);
  if (error) {
    console.error("delete message failed", error);
    return jsonError(500, "삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
  return NextResponse.json({ ok: true });
}
