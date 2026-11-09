import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ThemeKey } from "@/lib/domain";

export interface ReceivedBoard {
  id: string;
  title: string;
  theme: ThemeKey;
  recipient_name: string;
  gift_code: string;
  saved_at: string;
}

/**
 * 받은 보드 목록. saved_gifts 는 본인 것만 RLS 로 읽고,
 * 보드 정보는 남의 보드라 service role 로 필요한 컬럼만 가져온다 (참여 코드 등은 넘기지 않음).
 */
export async function listReceivedBoards(userId: string): Promise<ReceivedBoard[]> {
  const supabase = await createClient();
  const { data: saved } = await supabase
    .from("saved_gifts")
    .select("board_id, saved_at")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });
  if (!saved?.length) return [];

  const admin = createAdminClient();
  const { data: boards } = await admin
    .from("boards")
    .select("id, title, theme, recipient_name, gift_code")
    .in(
      "id",
      saved.map((s) => s.board_id),
    )
    .not("gift_code", "is", null);
  if (!boards) return [];

  const byId = new Map(boards.map((b) => [b.id, b]));
  return saved
    .map((s) => {
      const b = byId.get(s.board_id);
      return b ? ({ ...b, saved_at: s.saved_at } as ReceivedBoard) : null;
    })
    .filter((b): b is ReceivedBoard => b !== null);
}
