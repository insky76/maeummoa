import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { LIMITS } from "@/lib/domain";
import { findMessagesSchema } from "@/lib/validation";
import { jsonError, notConfigured, parseBody } from "@/lib/server/api";
import { getBoardByJoinCode } from "@/lib/server/public-boards";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 다른 기기에서 쓴 내 메시지 찾기: 이름 + 비밀번호가 둘 다 맞는 메시지만 돌려준다.
 * 비밀번호가 4자리라 무차별 대입을 막기 위해, 같은 이름 후보가 많으면 거절한다.
 */
const MAX_CANDIDATES = 5;

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const nc = notConfigured();
  if (nc) return nc;
  const { code } = await params;
  const board = await getBoardByJoinCode(code);
  if (!board) return jsonError(404, "보드를 찾을 수 없어요.");

  const parsed = await parseBody(request, findMessagesSchema);
  if (!parsed.ok) return parsed.response;
  const { nickname, password } = parsed.data;

  const admin = createAdminClient();
  const { data: candidates } = await admin
    .from("messages")
    .select("id, nickname, body, style, status, password_hash, pw_locked_until, created_at")
    .eq("board_id", board.id)
    .eq("nickname", nickname)
    .limit(MAX_CANDIDATES + 1);

  if (!candidates?.length) return jsonError(404, "이 이름으로 남긴 메시지가 없어요.");
  if (candidates.length > MAX_CANDIDATES) return jsonError(409, "같은 이름의 메시지가 너무 많아요. 개설자에게 문의해 주세요.");

  const now = Date.now();
  const unlocked = candidates.filter((c) => !c.pw_locked_until || Date.parse(c.pw_locked_until) <= now);
  if (!unlocked.length) return jsonError(423, "비밀번호를 여러 번 틀려 잠겼어요. 잠시 후 다시 시도해 주세요.");

  const matches = [];
  for (const c of unlocked) {
    if (await compare(password, c.password_hash)) {
      matches.push({ id: c.id, nickname: c.nickname, body: c.body, style: c.style, status: c.status, created_at: c.created_at });
    }
  }

  if (!matches.length) {
    // 틀린 시도는 후보 메시지 모두의 실패 횟수에 반영 (잠금 우회 방지)
    for (const c of unlocked) {
      const { data } = await admin.from("messages").select("pw_failed_count").eq("id", c.id).single();
      const failed = (data?.pw_failed_count ?? 0) + 1;
      const lock = failed >= LIMITS.passwordMaxTries;
      await admin
        .from("messages")
        .update({
          pw_failed_count: lock ? 0 : failed,
          pw_locked_until: lock ? new Date(now + LIMITS.passwordLockMinutes * 60000).toISOString() : null,
        })
        .eq("id", c.id);
    }
    return jsonError(401, "이름이나 비밀번호가 맞지 않아요.");
  }

  return NextResponse.json({ messages: matches });
}
