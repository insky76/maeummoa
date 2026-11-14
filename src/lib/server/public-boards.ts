import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BoardRow } from "@/lib/types";

/**
 * 로그인 없이 열리는 참여 페이지(/w)용 보드 조회. service role 로 읽되,
 * 화면에 필요한 컬럼만 고른다 (선물 코드 등은 넘기지 않는다).
 */
export type PublicBoard = Pick<
  BoardRow,
  | "id"
  | "recipient_name"
  | "theme"
  | "title"
  | "intro"
  | "deadline_at"
  | "status"
  | "join_code"
  | "opt_preview_messages"
  | "opt_require_approval"
  | "opt_surprise"
  | "opt_public_result"
> & {
  owner_nickname: string | null;
  /** 전달 완료 + 결과 공개일 때만 채워진다. 참여자가 완성된 선물을 볼 수 있게. */
  public_gift_code: string | null;
};

const PUBLIC_COLUMNS =
  "id, recipient_name, theme, title, intro, deadline_at, status, join_code, opt_preview_messages, opt_require_approval, opt_surprise, opt_public_result, gift_code, delivered_at, reveal_at, owner:profiles(nickname)";

const CODE_RE = /^[A-Za-z0-9]{5,16}$/;

/** generateMetadata 와 페이지가 같은 요청에서 두 번 조회하지 않도록 cache 로 감싼다. */
export const getBoardByJoinCode = cache(async (code: string): Promise<PublicBoard | null> => {
  if (!CODE_RE.test(code)) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.from("boards").select(PUBLIC_COLUMNS).eq("join_code", code).maybeSingle();
  if (error || !data) return null;
  const { owner, gift_code, delivered_at, reveal_at, ...rest } = data as unknown as Omit<
    PublicBoard,
    "owner_nickname" | "public_gift_code"
  > & {
    owner: { nickname: string | null } | null;
    gift_code: string | null;
    delivered_at: string | null;
    reveal_at: string | null;
  };
  const revealed =
    rest.status === "delivered" &&
    rest.opt_public_result &&
    !!delivered_at &&
    (!reveal_at || Date.parse(reveal_at) <= Date.now());
  return {
    ...rest,
    owner_nickname: owner?.nickname ?? null,
    public_gift_code: revealed ? gift_code : null,
  };
});

export interface PublicMessage {
  id: string;
  nickname: string;
  body: string;
  style: unknown;
  edited_by_owner: boolean;
  created_at: string;
}

const MESSAGE_COLUMNS = "id, nickname, body, style, edited_by_owner, created_at";

/** 공개된(visible) 메시지만. 비밀번호 해시 등은 절대 고르지 않는다. */
export async function listVisibleMessages(boardId: string, limit?: number): Promise<PublicMessage[]> {
  const admin = createAdminClient();
  let q = admin
    .from("messages")
    .select(MESSAGE_COLUMNS)
    .eq("board_id", boardId)
    .eq("status", "visible")
    .order("created_at", { ascending: false });
  if (limit) q = q.limit(limit);
  const { data } = await q;
  return (data as PublicMessage[] | null) ?? [];
}

/** 참여 인원 표시용. 숨김은 빼고, 승인 대기는 "참여"로 센다. */
export async function countParticipations(boardId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("board_id", boardId)
    .in("status", ["visible", "pending"]);
  return count ?? 0;
}

/** 한 메시지 (보드 소속 확인 포함) */
export async function getMessageInBoard(
  boardId: string,
  messageId: string,
): Promise<(PublicMessage & { status: string }) | null> {
  if (!/^[0-9a-f-]{36}$/i.test(messageId)) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("messages")
    .select(`${MESSAGE_COLUMNS}, status`)
    .eq("id", messageId)
    .eq("board_id", boardId)
    .maybeSingle();
  return (data as (PublicMessage & { status: string }) | null) ?? null;
}
