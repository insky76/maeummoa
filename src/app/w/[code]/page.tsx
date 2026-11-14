import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ThemeHeroArt } from "@/components/ThemeHero";
import { MessagePreviewList } from "@/components/MessagePreviewList";
import { THEMES } from "@/lib/domain";
import { effectiveStatus } from "@/lib/boards";
import { ddayLabel, formatDateKo } from "@/lib/date";
import { josa } from "@/lib/josa";
import { countMessages, getBoardByJoinCode, getOwnerNickname, listVisibleMessages } from "@/lib/server/public-boards";
import { themeStyle } from "@/lib/theme-style";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const board = await getBoardByJoinCode(code);
  if (!board) return { title: "보드를 찾을 수 없어요" };
  const theme = THEMES[board.theme];
  const description = `${josa(board.recipient_name, "이에게/에게")} 보낼 마음을 모으고 있어요. ${theme.writeCta}로 함께해 주세요.`;
  // 카카오톡 미리보기에는 보드 제목을 그대로 보여 준다 (기획 결정)
  return {
    title: { absolute: board.title },
    description,
    openGraph: { title: board.title, description, type: "website" },
    robots: { index: false },
  };
}

export default async function JoinPage({ params }: Props) {
  const { code } = await params;
  const board = await getBoardByJoinCode(code);
  if (!board) notFound();

  const theme = THEMES[board.theme];
  const ts = themeStyle(board.theme);
  const status = effectiveStatus(board);
  const [count, ownerNick, preview] = await Promise.all([
    countMessages(board.id),
    getOwnerNickname(board.owner_id),
    board.opt_preview_messages ? listVisibleMessages(board.id, 200) : Promise.resolve([]),
  ]);

  const chip =
    status === "collecting"
      ? { text: ddayLabel(board.deadline_at), cls: "bg-ok-soft text-ok" }
      : { text: "마감", cls: "bg-warn-soft text-warn" };

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white">
      <main className="flex flex-1 flex-col">
        <section
          className="flex flex-col items-center gap-3.5 px-6 pb-7 pt-5 text-center short:gap-2 short:pb-5 short:pt-3"
          style={{ background: board.theme === "flower" ? "#FCE8EC" : ts.headerBg, color: ts.ink }}
        >
          <div className="flex items-center justify-between self-stretch">
            <Link href="/" className="flex items-center gap-1.5 font-display text-[15px] font-bold" style={{ color: ts.sub }}>
              <Logo size={18} />
              마음모아
            </Link>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${chip.cls}`}>{chip.text}</span>
          </div>
          <div className="w-[170px] short:w-[110px] [&>svg]:h-auto [&>svg]:w-full">
            <ThemeHeroArt theme={board.theme} />
          </div>
          <h1 className="font-display text-[26px] font-bold leading-snug short:text-[22px]">{board.title}</h1>
          <p className="text-sm" style={{ color: ts.sub }}>
            {count > 0 ? <strong>{theme.countLine(count)}</strong> : `첫 번째 ${theme.item}을 기다리고 있어요`}
          </p>
        </section>

        <section className="flex flex-col gap-5 p-6 short:gap-4 short:p-5">
          {board.intro && (
            <div className="flex flex-col gap-2 rounded-2xl bg-surface p-4">
              <span className="text-xs font-bold text-ink-sub">
                {ownerNick ? `${josa(ownerNick, "이/가")} 남긴 한마디` : "개설자의 한마디"}
              </span>
              <p className="whitespace-pre-line text-[15px] leading-relaxed">{board.intro}</p>
            </div>
          )}

          {status === "collecting" && board.opt_surprise && (
            <p className="rounded-2xl bg-[#FFF6E0] px-4 py-3 text-[13px] leading-relaxed text-[#5C3D00]">
              {josa(board.recipient_name, "이에게/에게")} 몰래 준비하는 선물이에요. {formatDateKo(board.deadline_at)} 마감 후에
              한꺼번에 전달돼요.
            </p>
          )}

          {status !== "collecting" && (
            <p className="rounded-2xl bg-warn-soft px-4 py-3 text-[13px] leading-relaxed text-warn">
              모집이 마감됐어요. 더 이상 메시지를 남길 수 없어요.
            </p>
          )}

          {board.opt_preview_messages && preview.length > 0 && (
            <MessagePreviewList
              theme={board.theme}
              title={`먼저 ${board.theme === "flower" ? "꽂힌 꽃들" : board.theme === "star" ? "뜬 별들" : "붙은 쪽지들"}`}
              messages={preview.slice().reverse()}
            />
          )}

          <div className="flex justify-center gap-4 text-[13px]">
            <Link href={`/w/${code}/mine`} className="px-1 py-2.5 text-ink-sub underline-offset-4 hover:underline">
              내 메시지 수정·삭제
            </Link>
            <Link href="/" className="px-1 py-2.5 text-ink-sub underline-offset-4 hover:underline">
              나도 마음모아 만들기
            </Link>
          </div>
        </section>
      </main>

      <div className="sticky bottom-0 border-t border-line-soft bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        {status === "collecting" ? (
          <Link
            href={`/w/${code}/write`}
            className="flex h-[54px] items-center justify-center rounded-2xl bg-brand text-base font-bold text-white"
          >
            {theme.writeCta}
          </Link>
        ) : (
          <span className="flex h-[54px] items-center justify-center rounded-2xl bg-line-soft text-base font-bold text-ink-muted">
            마감된 보드예요
          </span>
        )}
      </div>
    </div>
  );
}
