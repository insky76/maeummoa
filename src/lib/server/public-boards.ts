import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOARD_COLUMNS } from "@/lib/server/boards";
import type { BoardRow, PublicMessage } from "@/lib/types";

/**
 * 로그인 없는 공개 경로(참여 /w, 선물 /g)용 조회. service role 로 읽으므로
 * 여기서 돌려주는 값은 화면에 내보내도 되는 컬럼으로 제한한다.
 */
export const PUBLIC_MESSAGE_COLUMNS = "id, nickname, body, style, created_at";

const CODE_RE = /^[A-Za-z0-9]{4,16}$/;

export const getBoardByJoinCode = cache(async (code: string): Promise<BoardRow | null> => {
  if (!CODE_RE.test(code)) return null;
  const { data, error } = await createAdminClient().from("boards").select(BOARD_COLUMNS).eq("join_code", code).maybeSingle();
  if (error) console.error("getBoardByJoinCode failed", error);
  return (data as BoardRow | null) ?? null;
});

export const getBoardByGiftCode = cache(async (code: string): Promise<BoardRow | null> => {
  if (!CODE_RE.test(code)) return null;
  const { data, error } = await createAdminClient().from("boards").select(BOARD_COLUMNS).eq("gift_code", code).maybeSingle();
  if (error) console.error("getBoardByGiftCode failed", error);
  return (data as BoardRow | null) ?? null;
});

/** 보드에 게시된(visible) 메시지. 오래된 것부터. */
export async function listVisibleMessages(boardId: string, limit = 1000): Promise<PublicMessage[]> {
  const { data, error } = await createAdminClient()
    .from("messages")
    .select(PUBLIC_MESSAGE_COLUMNS)
    .eq("board_id", boardId)
    .eq("status", "visible")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) console.error("listVisibleMessages failed", error);
  return (data as PublicMessage[] | null) ?? [];
}

export async function countMessages(
  boardId: string,
  statuses: ("visible" | "pending" | "hidden")[] = ["visible"],
): Promise<number> {
  const { count, error } = await createAdminClient()
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("board_id", boardId)
    .in("status", statuses);
  if (error) console.error("countMessages failed", error);
  return count ?? 0;
}

export const getOwnerNickname = cache(async (ownerId: string): Promise<string | null> => {
  const { data } = await createAdminClient().from("profiles").select("nickname").eq("id", ownerId).maybeSingle();
  return (data?.nickname as string | null | undefined) ?? null;
});

export { giftAccess, type GiftAccess } from "@/lib/gift-access";
