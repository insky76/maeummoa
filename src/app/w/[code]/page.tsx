import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { MessageGlyph } from "@/components/MessageGlyph";
import { ReportButton } from "@/components/ReportButton";
import { COVER_STYLE, ThemeArt } from "@/components/ThemeCover";
import { THEMES } from "@/lib/domain";
import { effectiveStatus, giftPath } from "@/lib/boards";
import { ddayLabel, formatDateKo } from "@/lib/date";
import { env } from "@/lib/env";
import { eulReul } from "@/lib/josa";
import { resolveVariant } from "@/lib/theme-styles";
import { countParticipations, getBoardByJoinCode, listVisibleMessages } from "@/lib/server/public-boards";

type Props = { params: Promise<{ code: string }> };

const PREVIEW_COUNT = 3;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!env.isSupabaseConfigured()) return { title: "마음모아" };
  const { code } = await params;
  const board = await getBoardByJoinCode(code);
  if (!board) return { title: "보드를 찾을 수 없어요", robots: { index: false } };
  const theme = THEMES[board.theme];
  const description = `${theme.writeCta}로 마음을 보태 주세요 · ${formatDateKo(board.deadline_at)}까지`;
  // 카카오톡 미리보기 카드에 쓰인다. 서프라이즈 정책상 제목은 그대로 보여 준다.
  return {
    title: board.title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title: board.title, description, type: "website" },
  };
}

export default async function JoinPage({ params }: Props) {
  if (!env.isSupabaseConfigured()) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] items-center justify-center px-6 text-center text-sm text-ink-sub">
        서버 설정(Supabase 키)이 아직 연결되지 않았어요.
      </main>
    );
  }
  const { code } = await params;
  const board = await getBoardByJoinCode(code);
  if (!board) notFound();

  const theme = THEMES[board.theme];
  const cover = COVER_STYLE[board.theme];
  const status = effectiveStatus(board);
  const open = status === "collecting";
  const [count, preview] = await Promise.all([
    countParticipations(board.id),
    board.opt_preview_messages ? listVisibleMessages(board.id, PREVIEW_COUNT + 1) : Promise.resolve([]),
  ]);
  const shown = preview.slice(0, PREVIEW_COUNT);
  const owner = board.owner_nickname ?? "개설자";

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white">
      <main className="flex flex-1 flex-col">
        <section
          className="flex flex-col items-center gap-3.5 px-6 pb-7 pt-5 text-center"
          style={{ background: cover.bg, color: cover.ink }}
        >
          <div className="flex w-full items-center justify-between">
            <Link href="/" className="flex items-center gap-1.5 font-display text-[15px] font-bold" style={{ color: cover.sub }}>
              <Logo size={18} />
              마음모아
            </Link>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${open ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"}`}
            >
              {open ? ddayLabel(board.deadline_at) : "마감"}
            </span>
          </div>
          <ThemeArt theme={board.theme} />
          <h1 className="font-display text-[26px] font-bold leading-snug">{board.title}</h1>
          <p className="text-sm" style={{ color: cover.sub }}>
            {count > 0 ? theme.participated(count) : `첫 번째 ${eulReul(theme.item)} 기다리고 있어요`}
          </p>
        </section>

        <section className="flex flex-col gap-5 p-6">
          {!open && (
            <div className="flex flex-col gap-3 rounded-2xl bg-warn-soft p-4 text-sm leading-relaxed text-warn">
              <p>
                <strong>마감된 보드예요.</strong> 이제는 메시지를 남길 수 없어요.
              </p>
              {board.public_gift_code && (
                <Link href={giftPath(board.public_gift_code)} className="self-start font-bold underline underline-offset-2">
                  완성된 {theme.sceneName(board.recipient_name)} 보러 가기
                </Link>
              )}
            </div>
          )}

          {board.intro && (
            <div className="flex flex-col gap-2 rounded-2xl bg-surface p-4">
              <span className="text-xs font-bold text-ink-sub">{owner}님이 남긴 한마디</span>
              <p className="whitespace-pre-line text-[15px] leading-relaxed">{board.intro}</p>
            </div>
          )}

          {open && board.opt_surprise && (
            <p className="rounded-2xl border border-line-soft px-4 py-3 text-[13px] leading-relaxed text-ink-sub">
              {board.recipient_name}에게는 비밀이에요. 이 링크는 {board.recipient_name}에게 보내지 말아 주세요.
            </p>
          )}

          {open && board.opt_require_approval && (
            <p className="px-1 text-[13px] text-ink-muted">남긴 메시지는 {owner}님이 확인한 뒤에 보드에 보여요.</p>
          )}

          {shown.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold">먼저 {theme.item === "꽃" ? "꽂힌 꽃들" : `모인 ${theme.item}`}</h2>
                <span className="text-xs text-ink-muted">개설자가 공개했어요</span>
              </div>
              <ul className="flex flex-col gap-2">
                {shown.map((m) => (
                  <li key={m.id} className="flex gap-3 rounded-2xl border border-line-soft p-3.5">
                    <MessageGlyph theme={board.theme} variant={resolveVariant(board.theme, m.style)} size={22} className="mt-0.5 shrink-0" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <strong className="text-[13px]">{m.nickname}</strong>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-[#2E2B3A]">{m.body}</p>
                    </div>
                    <ReportButton messageId={m.id} className="self-start" />
                  </li>
                ))}
              </ul>
              {count > PREVIEW_COUNT && (
                <p className="text-center text-[13px] text-ink-muted">
                  외 {count - PREVIEW_COUNT}개는 {board.recipient_name}에게 전달될 때 함께 볼 수 있어요
                </p>
              )}
            </div>
          )}

          <div className="flex justify-center gap-4 text-[13px]">
            <Link href={`/w/${board.join_code}/mine`} className="px-1 py-2.5 text-ink-sub underline underline-offset-2">
              내 메시지 수정·삭제
            </Link>
            <Link href="/" className="px-1 py-2.5 text-ink-sub underline underline-offset-2">
              나도 마음모아 만들기
            </Link>
          </div>
        </section>
      </main>

      {open && (
        <div className="sticky bottom-0 border-t border-line-soft bg-white px-5 pb-6 pt-3">
          <Link
            href={`/w/${board.join_code}/write`}
            className="flex h-[54px] items-center justify-center rounded-2xl bg-brand text-base font-bold text-white"
          >
            {theme.writeCta}
          </Link>
          <p className="mt-2 text-center text-xs text-ink-muted">{formatDateKo(board.deadline_at)} 자정까지 남길 수 있어요</p>
        </div>
      )}
    </div>
  );
}
