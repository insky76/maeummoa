import { notFound, redirect } from "next/navigation";
import { THEMES } from "@/lib/domain";
import { effectiveStatus } from "@/lib/boards";
import { getBoardByJoinCode } from "@/lib/server/public-boards";
import { variantsFor } from "@/lib/variants";
import { WriteForm } from "./WriteForm";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props) {
  const { code } = await params;
  const board = await getBoardByJoinCode(code);
  return { title: board ? THEMES[board.theme].writeCta : "메시지 남기기", robots: { index: false } };
}

export default async function WritePage({ params }: Props) {
  const { code } = await params;
  const board = await getBoardByJoinCode(code);
  if (!board) notFound();
  if (effectiveStatus(board) !== "collecting") redirect(`/w/${code}`);

  return (
    <WriteForm
      code={code}
      theme={board.theme}
      recipientName={board.recipient_name}
      variants={variantsFor(board.theme)}
      requireApproval={board.opt_require_approval}
    />
  );
}
