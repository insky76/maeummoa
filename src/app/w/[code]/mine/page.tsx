import Link from "next/link";
import { notFound } from "next/navigation";
import { BackIcon } from "@/components/icons";
import { effectiveStatus } from "@/lib/boards";
import { listMyMessages } from "@/lib/server/participant";
import { getBoardByJoinCode } from "@/lib/server/public-boards";
import { FindMyMessage } from "../FindMyMessage";
import { MyMessageCard } from "../MyMessageCard";

type Props = { params: Promise<{ code: string }> };

export const metadata = { title: "내 메시지", robots: { index: false } };

export default async function MinePage({ params }: Props) {
  const { code } = await params;
  const board = await getBoardByJoinCode(code);
  if (!board) notFound();
  const mine = await listMyMessages(board.id);
  const canEdit = effectiveStatus(board) === "collecting";

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center gap-1 px-2">
        <Link href={`/w/${code}`} aria-label="뒤로" className="flex h-11 w-11 items-center justify-center">
          <BackIcon />
        </Link>
        <span className="text-base font-bold">내 메시지</span>
      </header>

      <main className="flex flex-1 flex-col gap-5 px-5 pb-10 pt-2">
        {!canEdit && (
          <p className="rounded-2xl bg-warn-soft px-4 py-3 text-[13px] leading-relaxed text-warn">
            마감된 보드라 이제 고치거나 지울 수 없어요. 고칠 부분이 있다면 개설자에게 알려 주세요.
          </p>
        )}

        {mine.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h1 className="text-base font-bold">이 기기에서 남긴 메시지</h1>
            {mine.map((m) => (
              <MyMessageCard key={m.id} code={code} theme={board.theme} message={m} canEdit={canEdit} />
            ))}
          </section>
        ) : (
          <p className="py-6 text-center text-sm text-ink-sub">이 기기에서 남긴 메시지가 없어요.</p>
        )}

        <FindMyMessage code={code} />
      </main>
    </div>
  );
}
