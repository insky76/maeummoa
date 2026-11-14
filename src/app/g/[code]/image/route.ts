import { env } from "@/lib/env";
import { giftAccess } from "@/lib/gift-access";
import { posterImage } from "@/lib/server/og-images";
import { getBoardByGiftCode, listVisibleMessages } from "@/lib/server/public-boards";
import { createClient } from "@/lib/supabase/server";

// 메시지가 많으면 그리는 데 몇 초 걸린다
export const maxDuration = 30;

/** 결과 이미지 저장 (선물 페이지와 같은 공개 규칙) */
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const board = await getBoardByGiftCode(code);
  if (!board) return new Response("Not found", { status: 404 });

  let userId: string | null = null;
  if (env.isSupabaseConfigured()) {
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();
    userId = user?.id ?? null;
  }
  if (giftAccess(board, userId).kind !== "ok") return new Response("Forbidden", { status: 403 });

  return posterImage(board, await listVisibleMessages(board.id));
}
