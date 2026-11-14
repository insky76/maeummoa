import { posterImage } from "@/lib/server/og-images";
import { getOwnedBoard } from "@/lib/server/boards";
import { listVisibleMessages } from "@/lib/server/public-boards";

// 메시지가 많으면 그리는 데 몇 초 걸린다
export const maxDuration = 30;

/** 개설자 미리 보기에서 결과 이미지 저장 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await getOwnedBoard(id);
  if (!owned) return new Response("Not found", { status: 404 });
  return posterImage(owned.board, await listVisibleMessages(owned.board.id));
}
