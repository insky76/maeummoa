import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/Logo";
import { PlusIcon } from "@/components/icons";
import { StatusChip } from "@/components/StatusChip";
import { ThemeSwatch } from "@/components/ThemeSwatch";
import { THEMES } from "@/lib/domain";
import { effectiveStatus, giftPath } from "@/lib/boards";
import { ddayLabel, formatDateKo } from "@/lib/date";
import { env } from "@/lib/env";
import { listOwnedBoards } from "@/lib/server/boards";
import { listReceivedBoards } from "@/lib/server/saved-gifts";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "내 보드" };
export const dynamic = "force-dynamic";

type Tab = "made" | "received";

export default async function MyBoardsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  if (!env.isSupabaseConfigured()) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] items-center justify-center px-6 text-center text-sm text-ink-sub">
        Supabase 키가 아직 연결되지 않았어요. README 의 설정 순서를 따라 .env.local 을 채워 주세요.
      </main>
    );
  }

  const { tab: rawTab } = await searchParams;
  const tab: Tab = rawTab === "received" ? "received" : "made";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/me");

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-[480px] flex-col bg-surface">
      <header className="flex h-14 shrink-0 items-center justify-between bg-white px-5">
        <Link href="/">
          <Wordmark />
        </Link>
        <form action="/auth/signout" method="post">
          <button type="submit" className="px-1 py-3 text-sm font-medium text-ink-sub">
            로그아웃
          </button>
        </form>
      </header>

      <nav className="grid shrink-0 grid-cols-2 border-b border-line-soft bg-white" aria-label="보드 종류">
        {(
          [
            ["made", "만든 보드"],
            ["received", "받은 보드"],
          ] as const
        ).map(([key, label]) => (
          <Link
            key={key}
            href={key === "made" ? "/me" : "/me?tab=received"}
            aria-current={tab === key ? "page" : undefined}
            className={`flex h-12 items-center justify-center border-b-2 text-[15px] ${
              tab === key ? "border-ink font-bold text-ink" : "border-transparent font-medium text-ink-muted"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <main className="flex flex-1 flex-col gap-3 px-4 pb-28 pt-4">
        {tab === "made" ? <MadeList /> : <ReceivedList userId={user.id} />}
      </main>

      <Link
        href="/new"
        className="fixed bottom-7 right-[max(1.25rem,calc(50vw-240px+1.25rem))] flex h-14 items-center gap-2 rounded-full bg-brand px-5 text-[15px] font-bold text-white shadow-lg shadow-brand/30"
      >
        <PlusIcon />새 보드
      </Link>
    </div>
  );
}

async function MadeList() {
  const boards = await listOwnedBoards();
  if (!boards.length) {
    return <Empty text="아직 만든 보드가 없어요." sub="오른쪽 아래 '새 보드'로 첫 보드를 만들어 보세요." />;
  }
  return (
    <>
      {boards.map((b) => {
        const status = effectiveStatus(b);
        const theme = THEMES[b.theme];
        const meta =
          status === "collecting"
            ? `${theme.item} ${b.messageCount}${theme.unit} · 마감 ${ddayLabel(b.deadline_at)}`
            : status === "closed"
              ? `${theme.item} ${b.messageCount}${theme.unit} · ${b.opt_surprise ? "선물 완성을 기다려요" : "마감"}`
              : `${theme.item} ${b.messageCount}${theme.unit} · ${b.delivered_at ? `${formatDateKo(b.delivered_at)} ` : ""}선물 완성`;
        return (
          <Link
            key={b.id}
            href={`/boards/${b.id}`}
            className="flex gap-3.5 rounded-2xl border border-line-soft bg-white p-4"
          >
            <ThemeSwatch theme={b.theme} size={56} />
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="flex items-center gap-1.5">
                <StatusChip status={status} />
                <span className="text-xs text-ink-muted">{theme.label}</span>
              </span>
              <strong className="truncate text-base">{b.title}</strong>
              <span className="text-[13px] text-ink-sub">{meta}</span>
            </span>
          </Link>
        );
      })}
    </>
  );
}

async function ReceivedList({ userId }: { userId: string }) {
  const boards = await listReceivedBoards(userId);
  if (!boards.length) {
    return <Empty text="받은 보드가 없어요." sub="선물 링크를 연 뒤 '보관하기'를 누르면 여기에 모여요." />;
  }
  return (
    <>
      {boards.map((b) => (
        <Link
          key={b.id}
          href={giftPath(b.gift_code)}
          className="flex gap-3.5 rounded-2xl border border-line-soft bg-white p-4"
        >
          <ThemeSwatch theme={b.theme} size={56} />
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <StatusChip status="delivered" label="받은 선물" />
            <strong className="truncate text-base">{b.title}</strong>
            <span className="text-[13px] text-ink-sub">{formatDateKo(b.saved_at)} 보관</span>
          </span>
        </Link>
      ))}
    </>
  );
}

function Empty({ text, sub }: { text: string; sub: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-20 text-center">
      <p className="text-base font-bold">{text}</p>
      <p className="text-sm text-ink-sub">{sub}</p>
    </div>
  );
}
