import { giftOgImage, OG_SIZE } from "@/lib/server/og-images";
import { getBoardByGiftCode } from "@/lib/server/public-boards";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "마음모아 선물";

/** 선물 링크 미리보기. 메시지 내용은 넣지 않는다. */
export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const board = await getBoardByGiftCode(code);
  if (!board) return new Response("Not found", { status: 404 });
  return giftOgImage(board);
}
