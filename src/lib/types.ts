import type { BoardStatus, OccasionKey, ThemeKey } from "@/lib/domain";

/** boards 테이블 행 (개설자가 RLS 로 읽을 수 있는 컬럼) */
export interface BoardRow {
  id: string;
  owner_id: string;
  recipient_name: string;
  occasion: OccasionKey;
  theme: ThemeKey;
  title: string;
  intro: string | null;
  deadline_at: string;
  status: BoardStatus;
  join_code: string;
  gift_code: string | null;
  reveal_at: string | null;
  delivered_at: string | null;
  opt_preview_messages: boolean;
  opt_require_approval: boolean;
  opt_surprise: boolean;
  opt_public_result: boolean;
  recipient_user_id: string | null;
  owner_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MessageStatus = "visible" | "pending" | "hidden";

/** 화면에 내보내도 되는 메시지 정보 (비밀번호·기기 해시 등 제외) */
export interface PublicMessage {
  id: string;
  nickname: string;
  body: string;
  style: Record<string, unknown>;
  created_at: string;
}

/** 개설자 관리 화면용 메시지 */
export interface OwnerMessage extends PublicMessage {
  status: MessageStatus;
  edited_by_owner: boolean;
  report_count: number;
  updated_at: string;
}
