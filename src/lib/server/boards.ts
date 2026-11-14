import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BoardRow } from "@/lib/types";

const BOARD_COLUMNS =
  "id, owner_id, recipient_name, occasion, theme, title, intro, deadline_at, status, join_code, gift_code, reveal_at, delivered_at, opt_preview_messages, opt_require_approval, opt_surprise, opt_public_result, created_at, updated_at";

/**
 * 메시지 개수는 messages(id) 를 받아 길이로 센다.
 * messages(count) 는 count(*) 라서 테이블 단위 SELECT 권한이 필요한데,
 * password_hash 를 숨기려고 authenticated 에는 컬럼 단위 권한만 주었기 때문에 permission denied 가 난다.
 */
const BOARD_SELECT = `${BOARD_COLUMNS}, messages(id)`;
type BoardWithMessageIds = BoardRow & { messages: { id: string }[] | null };

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
    .select(BOARD_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) console.error("getOwnedBoard failed", error);
  if (error || !data) return null;
  const { messages, ...board } = data as BoardWithMessageIds;
  return { board: board as BoardRow, messageCount: messages?.length ?? 0 };
}

export async function listOwnedBoards(): Promise<(BoardRow & { messageCount: number })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boards")
    .select(BOARD_SELECT)
    .order("created_at", { ascending: false });

  if (error) console.error("listOwnedBoards failed", error);
  if (error || !data) return [];
  return (data as BoardWithMessageIds[]).map(({ messages, ...b }) => ({
    ...(b as BoardRow),
    messageCount: messages?.length ?? 0,
  }));
}
