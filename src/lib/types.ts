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
  created_at: string;
  updated_at: string;
}
