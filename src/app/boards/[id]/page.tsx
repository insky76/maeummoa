import Link from "next/link";
import { notFound } from "next/navigation";
import { BackIcon } from "@/components/icons";
import { StatusChip } from "@/components/StatusChip";
import { THEMES } from "@/lib/domain";
import { displayUrl, effectiveStatus, giftPath, joinPath } from "@/lib/boards";
import { ddayLabel, formatDateKo } from "@/lib/date";
import { getOwnedBoard } from "@/lib/server/boards";
import { siteOrigin } from "@/lib/server/site";

export const metadata = { title: "보드 관리" };

// M2: 현황 요약. 메시지 관리·설정 변경·마감·전달하기는 M5 에서 이 화면에 탭으로 추가한다.
export default async function BoardManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getOwnedBoard(id);
  if (!result) notFound();
  const { board, messageCount } = result;

  const status = effectiveStatus(board);
  const theme = THEMES[board.theme];
  const origin = await siteOrigin();
  const joinUrl = `${origin}${joinPath(board.join_code)}`;

  const settings = [
    ["다른 사람 메시지 미리 보기", board.opt_preview_messages],
    ["승인 후 게시", board.opt_require_approval],
    ["서프라이즈 모드", board.opt_surprise],
    ["결과 페이지 공개", board.opt_public_result],
  ] as const;

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-surface">
      <header className="flex flex-col bg-white px-2 pb-3 pt-1">
        <div className="flex h-12 items-center gap-1">
          <Link href="/me" aria-label="내 보드로" className="flex h-11 w-11 items-center justify-center">
            <BackIcon />
          </Link>
          <span className="text-base font-bold">보드 관리</span>
        </div>
        <div className="flex flex-col gap-1.5 px-3 pt-1">
          <StatusChip status={status} />
          <h1 className="font-display text-[22px] font-bold">{board.title}</h1>
          <span className="text-[13px] text-ink-sub">
            {theme.label} 테마 · {formatDateKo(board.deadline_at)} 자정 마감
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-3 p-4">
        <div className="grid grid-cols-3 gap-2">
          <Stat label={`모인 ${theme.item}`} value={`${messageCount}${theme.unit}`} />
          <Stat label="마감까지" value={status === "collecting" ? ddayLabel(board.deadline_at) : "마감"} />
          <Stat label="주인공" value={board.recipient_name} />
        </div>

        <section className="flex flex-col gap-2.5 rounded-2xl border border-line-soft bg-white p-4">
          <span className="text-[13px] font-bold text-ink-sub">참여 링크</span>
          <div className="flex items-center gap-2">
            <span className="flex-1 truncate text-[15px]">{displayUrl(joinUrl)}</span>
            <Link
              href={`/boards/${board.id}/share`}
              className="flex h-10 items-center rounded-[10px] bg-[#F4F3F8] px-3.5 text-[13px] font-bold"
            >
              공유하기
            </Link>
          </div>
          {board.gift_code && (
            <>
              <span className="mt-2 text-[13px] font-bold text-ink-sub">선물 링크</span>
              <span className="truncate text-[15px]">{displayUrl(`${origin}${giftPath(board.gift_code)}`)}</span>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-line-soft bg-white px-4">
          {settings.map(([label, on]) => (
            <div key={label} className="flex items-center justify-between border-b border-line-soft py-3.5 last:border-0">
              <span className="text-sm">{label}</span>
              <span className={`text-sm font-bold ${on ? "text-brand" : "text-ink-muted"}`}>{on ? "켜짐" : "꺼짐"}</span>
            </div>
          ))}
        </section>

        <p className="px-1 text-[13px] leading-relaxed text-ink-muted">
          메시지 관리, 설정 변경, 마감과 전달하기는 곧 이 화면에 추가돼요.
        </p>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl border border-line-soft bg-white px-3 py-3.5">
      <span className="text-xs text-ink-sub">{label}</span>
      <strong className="truncate text-xl">{value}</strong>
    </div>
  );
}
