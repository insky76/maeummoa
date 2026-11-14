import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageArt } from "@/components/shapes";
import { THEMES } from "@/lib/domain";
import { effectiveStatus } from "@/lib/boards";
import { formatDateKo } from "@/lib/date";
import { josa } from "@/lib/josa";
import { listMyMessages, messageOrdinal } from "@/lib/server/participant";
import { getBoardByJoinCode } from "@/lib/server/public-boards";
import { MyMessageCard } from "../MyMessageCard";

type Props = { params: Promise<{ code: string }>; searchParams: Promise<{ m?: string }> };

export const metadata = { title: "남겼어요", robots: { index: false } };

export default async function DonePage({ params, searchParams }: Props) {
  const { code } = await params;
  const { m } = await searchParams;
  const board = await getBoardByJoinCode(code);
  if (!board) notFound();

  const theme = THEMES[board.theme];
  const mine = (await listMyMessages(board.id)).find((x) => x.id === m);
  const ordinal = mine ? await messageOrdinal(board.id, mine.created_at) : 0;
  const canEdit = effectiveStatus(board) === "collecting";

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white">
      <main className="flex flex-1 flex-col gap-7 px-6 pb-6 pt-14">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <span className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-brand-soft">
            <MessageArt theme={board.theme} style={mine?.style} size={72} />
          </span>
          <h1 className="font-display text-2xl font-bold">
            {mine && ordinal > 0 ? theme.doneTitle(ordinal) : "메시지를 남겼어요!"}
          </h1>
          <p className="text-sm leading-relaxed text-ink-sub">
            {mine?.status === "pending" ? (
              <>개설자가 확인하면 보드에 올라가요.</>
            ) : board.opt_surprise ? (
              <>
                {formatDateKo(board.deadline_at)} 마감 후, 모인 {theme.item}들이
                <br />
                {josa(theme.sceneLabel, "이/가")} 되어 {josa(board.recipient_name, "이에게/에게")} 전달돼요.
              </>
            ) : (
              <>{josa(board.recipient_name, "이/가")} 지금 바로 볼 수 있어요.</>
            )}
          </p>
        </div>

        {mine && <MyMessageCard code={code} theme={board.theme} message={mine} canEdit={canEdit} />}
      </main>

      <div className="flex flex-col gap-2 border-t border-line-soft px-5 pb-6 pt-3">
        <Link
          href={`/w/${code}`}
          className="flex h-[54px] items-center justify-center rounded-2xl bg-brand text-base font-bold text-white"
        >
          다른 {theme.item} 구경하기
        </Link>
        <Link href="/" className="flex h-12 items-center justify-center text-[15px] font-medium text-ink-sub">
          나도 마음모아 만들기
        </Link>
      </div>
    </div>
  );
}
