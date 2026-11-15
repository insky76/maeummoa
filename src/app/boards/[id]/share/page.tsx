import Link from "next/link";
import { notFound } from "next/navigation";
import { BackIcon } from "@/components/icons";
import { OwnerNav } from "@/components/OwnerNav";
import { ShareLinkPanel } from "@/components/ShareLinkPanel";
import { ThemeTile } from "@/components/ThemeTile";
import { THEMES } from "@/lib/domain";
import { displayUrl, giftPath, joinPath } from "@/lib/boards";
import { formatDateKo } from "@/lib/date";
import { getOwnedBoard } from "@/lib/server/boards";
import { qrSvg, siteOrigin } from "@/lib/server/site";

export const metadata = { title: "링크 공유" };

export default async function BoardSharePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const result = await getOwnedBoard(id);
  if (!result) notFound();
  const { board } = result;

  const origin = await siteOrigin();
  const joinUrl = `${origin}${joinPath(board.join_code)}`;
  const giftUrl = board.gift_code ? `${origin}${giftPath(board.gift_code)}` : null;
  const theme = THEMES[board.theme];
  const [joinQr, giftQr] = await Promise.all([qrSvg(joinUrl), giftUrl ? qrSvg(giftUrl) : Promise.resolve("")]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between px-2">
        <Link href={`/boards/${board.id}`} className="flex h-11 items-center gap-1 pr-2 text-[15px] font-bold">
          <BackIcon />
          보드 관리
        </Link>
        <OwnerNav />
      </header>

      <main className="flex flex-1 flex-col gap-6 px-5 pb-6 short:gap-4">
        <div className="flex flex-col items-center gap-3 pt-2 text-center short:gap-2 short:pt-0">
          <div className="w-28 short:w-20">
            {board.theme === "flower" || board.theme === "star" || board.theme === "note" ? (
              <ThemeTile theme={board.theme} />
            ) : null}
          </div>
          <h1 className="font-display text-2xl font-bold leading-snug short:text-xl">
            {created ? (
              <>
                {theme.sceneName(board.recipient_name)} 보드가
                <br />
                열렸어요
              </>
            ) : (
              board.title
            )}
          </h1>
          <p className="text-sm leading-relaxed text-ink-sub">
            아래 참여 링크를 친구들에게 보내 주세요.
            <br />
            {formatDateKo(board.deadline_at)} 자정까지 모을 수 있어요.
          </p>
        </div>

        <ShareLinkPanel
          label="참여 링크"
          url={joinUrl}
          displayUrl={displayUrl(joinUrl)}
          qrSvg={joinQr}
          shareTitle={board.title}
        />

        {board.opt_surprise ? (
          <div className="flex gap-3 rounded-2xl bg-[#FFF6E0] p-4">
            <span aria-hidden="true" className="mt-0.5 text-[#8A5A00]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 16v.01" />
              </svg>
            </span>
            <p className="text-[13px] leading-relaxed text-[#5C3D00]">
              참여 링크는 {board.recipient_name}에게 보내지 마세요. 마감 후 <strong>보드 관리 › 선물 완성하기</strong>를 누르면
              나오는 선물 링크를 따로 보내요.
            </p>
          </div>
        ) : (
          giftUrl && (
            <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-line p-4">
              <p className="text-[13px] leading-relaxed text-ink-sub">
                서프라이즈 모드가 꺼져 있어요. 아래 선물 링크를 {board.recipient_name}에게 보내면 메시지가 모이는 과정을
                실시간으로 볼 수 있어요.
              </p>
              <ShareLinkPanel
                label={`${board.recipient_name}에게 보낼 선물 링크`}
                url={giftUrl}
                displayUrl={displayUrl(giftUrl)}
                qrSvg={giftQr}
                shareTitle={theme.sceneName(board.recipient_name)}
              />
            </div>
          )
        )}
      </main>

      <div className="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-line-soft bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <Link
          href={joinPath(board.join_code)}
          className="flex h-[52px] items-center justify-center rounded-2xl border border-line text-[15px] font-bold"
        >
          참여 화면 보기
        </Link>
        <Link
          href={`/boards/${board.id}`}
          className="flex h-[52px] items-center justify-center rounded-2xl bg-brand text-[15px] font-bold text-white"
        >
          보드 관리
        </Link>
      </div>
    </div>
  );
}
