import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageGlyph } from "@/components/MessageGlyph";
import { COVER_STYLE } from "@/components/ThemeCover";
import { THEMES } from "@/lib/domain";
import { effectiveStatus } from "@/lib/boards";
import { formatDateKo } from "@/lib/date";
import { env } from "@/lib/env";
import { iGa } from "@/lib/josa";
import { resolveVariant } from "@/lib/theme-styles";
import { getBoardByJoinCode, getMessageInBoard } from "@/lib/server/public-boards";
import { MyMessageCard } from "./MyMessageCard";

export const metadata: Metadata = { title: "남겨 주셔서 고마워요", robots: { index: false, follow: false } };

export default async function DonePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ m?: string; n?: string }>;
}) {
  if (!env.isSupabaseConfigured()) notFound();
  const { code } = await params;
  const { m, n } = await searchParams;
  const board = await getBoardByJoinCode(code);
  if (!board) notFound();

  const message = m ? await getMessageInBoard(board.id, m) : null;
  const theme = THEMES[board.theme];
  const cover = COVER_STYLE[board.theme];
  const ordinal = Number(n);
  const open = effectiveStatus(board) === "collecting";
  const variant = resolveVariant(board.theme, message?.style);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white">
      <main className="flex flex-1 flex-col gap-6 px-5 pb-6 pt-10">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full" style={{ background: cover.bg }}>
            <MessageGlyph theme={board.theme} variant={variant} size={72} />
          </div>
          <h1 className="font-display text-[26px] font-bold">
            {Number.isInteger(ordinal) && ordinal > 0 ? theme.ordinal(ordinal) : "남겨 주셔서 고마워요!"}
          </h1>
          <p className="text-sm leading-relaxed text-ink-sub">
            {board.opt_surprise ? (
              <>
                {formatDateKo(board.deadline_at)} 마감 후, 모인 마음이
                <br />
                {iGa(theme.sceneName(board.recipient_name))} 되어 전달돼요.
              </>
            ) : (
              <>{iGa(board.recipient_name)} 지금 바로 볼 수 있어요.</>
            )}
          </p>
        </div>

        {message && message.status !== "hidden" ? (
          <MyMessageCard
            code={board.join_code}
            theme={board.theme}
            canModify={open}
            message={{
              id: message.id,
              nickname: message.nickname,
              body: message.body,
              style: message.style,
              pending: message.status === "pending",
            }}
          />
        ) : (
          <p className="rounded-2xl border border-line-soft p-4 text-sm text-ink-muted">메시지를 찾을 수 없어요.</p>
        )}
      </main>

      <div className="sticky bottom-0 flex flex-col gap-2 border-t border-line-soft bg-white px-5 pb-6 pt-3">
        <Link
          href={`/w/${board.join_code}`}
          className="flex h-[54px] items-center justify-center rounded-2xl bg-ink text-base font-bold text-white"
        >
          다른 {theme.item}들 구경하기
        </Link>
        <Link href="/" className="flex h-12 items-center justify-center rounded-2xl text-[15px] font-bold text-brand">
          나도 마음모아 만들기
        </Link>
      </div>
    </div>
  );
}
