import { notFound } from "next/navigation";
import { GiftView } from "@/components/gift/GiftView";
import { giftPath } from "@/lib/boards";
import { getOwnedBoard } from "@/lib/server/boards";
import { listVisibleMessages } from "@/lib/server/public-boards";
import { siteOrigin } from "@/lib/server/site";

export const metadata = { title: "결과 미리 보기" };
export const dynamic = "force-dynamic";

/** 개설자 전용: 주인공에게 보일 결과 화면을 전달 전에 미리 본다 (게시된 메시지만) */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await getOwnedBoard(id);
  if (!owned) notFound();
  const { board } = owned;
  const messages = await listVisibleMessages(board.id);
  const origin = await siteOrigin();

  return (
    <GiftView
      board={{ id: board.id, title: board.title, theme: board.theme, recipient_name: board.recipient_name }}
      messages={messages}
      mode="preview"
      giftUrl={board.gift_code ? `${origin}${giftPath(board.gift_code)}` : null}
      imageUrl={`/boards/${board.id}/image`}
      live={false}
      canSave={false}
      saved={false}
    />
  );
}
