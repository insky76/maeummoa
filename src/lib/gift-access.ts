import type { BoardRow } from "@/lib/types";

/**
 * 선물 페이지를 보여 줘도 되는지.
 * - 개설자는 언제나 미리 볼 수 있다.
 * - 서프라이즈 ON: 전달 후, 예약 공개 시각이 지난 뒤부터. OFF: 언제나 (모으는 동안 실시간).
 * - 결과 비공개: 로그인한 주인공 한 명만. 처음 연 로그인 사용자가 "선물 받기"로 주인공이 된다.
 */
export type GiftAccess =
  | { kind: "ok"; asOwner: boolean }
  | { kind: "wrapping"; revealAt: string | null }
  | { kind: "login" }
  | { kind: "claim" }
  | { kind: "private" };

export function giftAccess(board: BoardRow, userId: string | null, now: Date = new Date()): GiftAccess {
  if (userId && userId === board.owner_id) return { kind: "ok", asOwner: true };

  const revealed = !board.reveal_at || Date.parse(board.reveal_at) <= now.getTime();
  const released = board.opt_surprise ? board.status === "delivered" && revealed : true;
  if (!released) {
    return { kind: "wrapping", revealAt: board.status === "delivered" && !revealed ? board.reveal_at : null };
  }

  if (board.opt_public_result) return { kind: "ok", asOwner: false };
  if (!userId) return { kind: "login" };
  if (board.recipient_user_id === userId) return { kind: "ok", asOwner: false };
  if (!board.recipient_user_id) return { kind: "claim" };
  return { kind: "private" };
}
