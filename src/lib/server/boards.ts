import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BoardRow } from "@/lib/types";

const BOARD_COLUMNS =
  "id, owner_id, recipient_name, occasion, theme, title, intro, deadline_at, status, join_code, gift_code, reveal_at, delivered_at, opt_preview_messages, opt_require_approval, opt_surprise, opt_public_result, created_at, updated_at";

/**
 * 로그인한 개설자 본인의 보드. RLS 때문에 남의 보드는 null 로 돌아온다.
 * messageCount 는 숨김·승인 대기를 포함한 전체 개수.
 */
export async function getOwnedBoard(id: string): Promise<{ board: BoardRow; messageCount: number } | null> {
  // uuid 형식이 아니면 DB 에러 대신 바로 없음 처리
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boards")
    .select(`${BOARD_COLUMNS}, messages(count)`)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  const { messages, ...board } = data as BoardRow & { messages: { count: number }[] };
  return { board: board as BoardRow, messageCount: messages?.[0]?.count ?? 0 };
}

export async function listOwnedBoards(): Promise<(BoardRow & { messageCount: number })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boards")
    .select(`${BOARD_COLUMNS}, messages(count)`)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as (BoardRow & { messages: { count: number }[] })[]).map(({ messages, ...b }) => ({
    ...(b as BoardRow),
    messageCount: messages?.[0]?.count ?? 0,
  }));
}
