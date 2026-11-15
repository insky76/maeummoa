import type { BoardStatus } from "@/lib/domain";
import type { BoardRow } from "@/lib/types";

/**
 * 화면에 보여 줄 보드 상태.
 * DB 상태가 collecting 이어도 마감 시각이 지났으면 마감으로 본다.
 * (자동 마감 작업 없이도 화면과 작성 API 가 같은 기준을 쓰도록 이 함수를 공용으로 쓴다.)
 */
export function effectiveStatus(
  board: Pick<BoardRow, "status" | "deadline_at">,
  now: Date = new Date(),
): BoardStatus {
  if (board.status === "collecting" && Date.parse(board.deadline_at) <= now.getTime()) {
    return "closed";
  }
  return board.status;
}

export const STATUS_LABEL: Record<BoardStatus, string> = {
  collecting: "모으는 중",
  closed: "마감",
  delivered: "선물 완성",
};

export function joinPath(code: string) {
  return `/w/${code}`;
}

export function giftPath(code: string) {
  return `/g/${code}`;
}

/** 화면에 표시할 짧은 주소 (https:// 생략) */
export function displayUrl(absoluteUrl: string) {
  return absoluteUrl.replace(/^https?:\/\//, "");
}
