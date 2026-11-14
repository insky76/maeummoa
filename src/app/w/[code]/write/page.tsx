import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { THEMES } from "@/lib/domain";
import { effectiveStatus } from "@/lib/boards";
import { env } from "@/lib/env";
import { variantsFor } from "@/lib/theme-styles";
import { getBoardByJoinCode } from "@/lib/server/public-boards";
import { WriteForm } from "./WriteForm";

type Props = { params: Promise<{ code: string }> };

export const metadata: Metadata = { title: "메시지 남기기", robots: { index: false, follow: false } };

export default async function WritePage({ params }: Props) {
  if (!env.isSupabaseConfigured()) notFound();
  const { code } = await params;
  const board = await getBoardByJoinCode(code);
  if (!board) notFound();
  if (effectiveStatus(board) !== "collecting") redirect(`/w/${code}`);

  const theme = THEMES[board.theme];
  return (
    <WriteForm
      code={board.join_code}
      theme={board.theme}
      recipient={board.recipient_name}
      heading={theme.writeCta}
      submitLabel={theme.submitCta}
      variants={variantsFor(board.theme)}
    />
  );
}
