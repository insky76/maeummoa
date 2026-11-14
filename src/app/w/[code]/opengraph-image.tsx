import { joinOgImage, OG_SIZE } from "@/lib/server/og-images";
import { countMessages, getBoardByJoinCode } from "@/lib/server/public-boards";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "마음모아 참여 링크";

/** 카카오톡·메신저 링크 미리보기 카드 (보드 제목, 모인 개수, 작성 버튼) */
export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const board = await getBoardByJoinCode(code);
  if (!board) return new Response("Not found", { status: 404 });
  return joinOgImage(board, await countMessages(board.id));
}
