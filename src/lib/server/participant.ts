import "server-only";
import { readMyMessageIds } from "@/lib/server/my-messages";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MessageStatus } from "@/lib/types";

export interface MyMessage {
  id: string;
  nickname: string;
  body: string;
  style: Record<string, unknown>;
  status: MessageStatus;
  created_at: string;
}

/** 이 기기에서 쓴(쿠키에 기억된) 메시지들. 지워진 것은 빠진다. */
export async function listMyMessages(boardId: string): Promise<MyMessage[]> {
  const ids = await readMyMessageIds(boardId);
  if (!ids.length) return [];
  const { data, error } = await createAdminClient()
    .from("messages")
    .select("id, nickname, body, style, status, created_at")
    .eq("board_id", boardId)
    .in("id", ids)
    .order("created_at", { ascending: false });
  if (error) console.error("listMyMessages failed", error);
  return (data as MyMessage[] | null) ?? [];
}

/** 이 메시지가 보드에서 몇 번째로 남겨졌는지 (숨김 제외) */
export async function messageOrdinal(boardId: string, createdAt: string): Promise<number> {
  const { count } = await createAdminClient()
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("board_id", boardId)
    .in("status", ["visible", "pending"])
    .lte("created_at", createdAt);
  return count ?? 0;
}
