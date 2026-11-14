import { notFound, redirect } from "next/navigation";
import { GiftView } from "@/components/gift/GiftView";
import { THEMES } from "@/lib/domain";
import { effectiveStatus } from "@/lib/boards";
import { getBoardByJoinCode, listVisibleMessages } from "@/lib/server/public-boards";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props) {
  const { code } = await params;
  const board = await getBoardByJoinCode(code);
  return { title: board ? `${THEMES[board.theme].sceneLabel} 미리 보기` : "미리 보기", robots: { index: false } };
}

/**
 * 참여자 결과 미리 보기: 지금까지 모인 메시지로 꾸민 장면.
 * 개설자가 "다른 사람 메시지 미리 보기"를 켠 보드에서만 열린다 (끄면 참여 화면으로 돌아간다).
 */
export default async function ParticipantPreviewPage({ params }: Props) {
  const { code } = await params;
  const board = await getBoardByJoinCode(code);
  if (!board) notFound();
  if (!board.opt_preview_messages) redirect(`/w/${code}`);

  const messages = await listVisibleMessages(board.id);
  const collecting = effectiveStatus(board) === "collecting";

  return (
    <GiftView
      board={{ id: board.id, title: board.title, theme: board.theme, recipient_name: board.recipient_name }}
      messages={messages}
      mode="participant"
      giftUrl={null}
      imageUrl={null}
      live={false}
      canSave={false}
      saved={false}
      participant={{
        joinHref: `/w/${code}`,
        writeHref: collecting ? `/w/${code}/write` : null,
        recipientName: board.recipient_name,
      }}
    />
  );
}
