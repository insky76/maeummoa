import "server-only";
import { compare } from "bcryptjs";
import { LIMITS } from "@/lib/domain";
import { effectiveStatus } from "@/lib/boards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BoardRow } from "@/lib/types";

type AuthBoard = Pick<BoardRow, "id" | "theme" | "status" | "deadline_at" | "opt_require_approval">;

export type MessageAuthResult =
  | {
      ok: true;
      message: { id: string; board_id: string; status: string };
      board: AuthBoard;
    }
  | { ok: false; status: number; error: string };

/**
 * 참여자 비밀번호 확인. 5번 틀리면 10분 동안 잠근다.
 * 마감·전달된 보드의 메시지는 참여자가 더 이상 고칠 수 없다 (개설자는 관리 화면에서 가능).
 */
export async function authorizeMessage(messageId: string, password: string): Promise<MessageAuthResult> {
  if (!/^[0-9a-f-]{36}$/i.test(messageId)) return { ok: false, status: 404, error: "메시지를 찾을 수 없어요." };
  if (!/^\d{4}$/.test(password)) return { ok: false, status: 400, error: "비밀번호는 숫자 4자리예요." };

  const admin = createAdminClient();
  const { data: msg } = await admin
    .from("messages")
    .select(
      "id, board_id, status, password_hash, pw_failed_count, pw_locked_until, board:boards(id, theme, status, deadline_at, opt_require_approval)",
    )
    .eq("id", messageId)
    .maybeSingle();

  if (!msg) return { ok: false, status: 404, error: "메시지를 찾을 수 없어요." };
  const board = (msg as unknown as { board: AuthBoard }).board;

  if (effectiveStatus(board) !== "collecting") {
    return { ok: false, status: 409, error: "마감된 보드라 메시지를 고칠 수 없어요." };
  }

  const now = Date.now();
  if (msg.pw_locked_until && Date.parse(msg.pw_locked_until) > now) {
    const mins = Math.ceil((Date.parse(msg.pw_locked_until) - now) / 60000);
    return { ok: false, status: 423, error: `비밀번호를 여러 번 틀려 잠겼어요. ${mins}분 뒤에 다시 시도해 주세요.` };
  }

  const match = await compare(password, msg.password_hash);
  if (!match) {
    const failed = (msg.pw_failed_count ?? 0) + 1;
    const lock = failed >= LIMITS.passwordMaxTries;
    await admin
      .from("messages")
      .update({
        pw_failed_count: lock ? 0 : failed,
        pw_locked_until: lock ? new Date(now + LIMITS.passwordLockMinutes * 60000).toISOString() : null,
      })
      .eq("id", msg.id);
    const left = LIMITS.passwordMaxTries - failed;
    return lock
      ? {
          ok: false,
          status: 423,
          error: `비밀번호를 ${LIMITS.passwordMaxTries}번 틀려 ${LIMITS.passwordLockMinutes}분 동안 잠겼어요.`,
        }
      : { ok: false, status: 401, error: `비밀번호가 맞지 않아요. 남은 시도 ${left}회` };
  }

  if (msg.pw_failed_count || msg.pw_locked_until) {
    await admin.from("messages").update({ pw_failed_count: 0, pw_locked_until: null }).eq("id", msg.id);
  }

  return { ok: true, message: { id: msg.id, board_id: msg.board_id, status: msg.status }, board };
}
