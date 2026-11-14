import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { BackIcon } from "@/components/icons";
import { OwnerNav } from "@/components/OwnerNav";
import { ShareLinkPanel } from "@/components/ShareLinkPanel";
import { StatusChip } from "@/components/StatusChip";
import { THEMES } from "@/lib/domain";
import { displayUrl, effectiveStatus, giftPath, joinPath } from "@/lib/boards";
import { addDays, ddayLabel, formatDateKo, formatDateTimeKo, todayKST, toKSTDate } from "@/lib/date";
import { getOwnedBoard, listOwnerMessages } from "@/lib/server/boards";
import { qrSvg, siteOrigin } from "@/lib/server/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { DeadlineControls, DeliverButton, RevealNowButton } from "./BoardControls";
import { MessageManager } from "./MessageManager";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "보드 관리" };
export const dynamic = "force-dynamic";

type Tab = "overview" | "messages" | "settings";

export default async function BoardManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab: Tab = rawTab === "messages" || rawTab === "settings" ? rawTab : "overview";

  // 보드와 메시지를 동시에 (메시지는 RLS 로 본인 보드 것만 온다)
  const [result, messages] = await Promise.all([getOwnedBoard(id), listOwnerMessages(id)]);
  if (!result) notFound();
  const { board } = result;

  const status = effectiveStatus(board);
  const theme = THEMES[board.theme];
  const origin = await siteOrigin();
  const joinUrl = `${origin}${joinPath(board.join_code)}`;
  const giftUrl = board.gift_code ? `${origin}${giftPath(board.gift_code)}` : null;

  const visible = messages.filter((m) => m.status === "visible").length;
  const pending = messages.filter((m) => m.status === "pending").length;
  const reported = messages.filter((m) => m.report_count > 0 && m.status !== "hidden").length;
  const seenAt = board.owner_seen_at;
  const newCount = messages.filter((m) => !seenAt || Date.parse(m.created_at) > Date.parse(seenAt)).length;

  // 메시지 탭을 열면 "새 메시지" 기준 시각을 지금으로 옮긴다 (이번 화면은 이전 기준으로 표시)
  if (tab === "messages") {
    // 화면을 먼저 보내고 응답 뒤에 기록한다
    after(async () => {
      await createAdminClient().from("boards").update({ owner_seen_at: new Date().toISOString() }).eq("id", board.id);
    });
  }

  const delivered = board.status === "delivered";
  const revealPending = delivered && board.reveal_at && Date.parse(board.reveal_at) > Date.now();
  const giftQr = giftUrl && (delivered || !board.opt_surprise) ? await qrSvg(giftUrl) : "";
  const today = todayKST();

  const tabs: [Tab, string][] = [
    ["overview", "현황"],
    ["messages", `메시지 ${messages.length}`],
    ["settings", "설정"],
  ];

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-surface">
      <header className="flex flex-col bg-white px-2 pb-3 pt-1">
        <div className="flex h-12 items-center gap-1">
          <Link href="/me" aria-label="내 보드로" className="flex h-11 w-11 items-center justify-center">
            <BackIcon />
          </Link>
          <span className="text-base font-bold">보드 관리</span>
          <OwnerNav className="ml-auto" />
        </div>
        <div className="flex flex-col gap-1.5 px-3 pt-1">
          <StatusChip status={status} />
          <h1 className="font-display text-[22px] font-bold">{board.title}</h1>
          <span className="text-[13px] text-ink-sub">
            {theme.label} 테마 · {formatDateKo(board.deadline_at)} 자정 마감
          </span>
        </div>
      </header>

      <nav role="tablist" aria-label="보드 관리" className="grid shrink-0 grid-cols-3 border-b border-line-soft bg-white">
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            role="tab"
            aria-selected={tab === key}
            href={key === "overview" ? `/boards/${board.id}` : `/boards/${board.id}?tab=${key}`}
            className={`flex h-12 items-center justify-center gap-1 border-b-2 text-[15px] ${
              tab === key ? "border-ink font-bold text-ink" : "border-transparent font-medium text-ink-muted"
            }`}
          >
            {label}
            {key === "messages" && newCount > 0 && tab !== "messages" && (
              <span className="h-2 w-2 rounded-full bg-brand" aria-label="새 메시지 있음" />
            )}
          </Link>
        ))}
      </nav>

      <main className="flex flex-1 flex-col gap-3 p-4 pb-8">
        {tab === "overview" && (
          <>
            {delivered && (
              <section className="flex flex-col gap-3 rounded-2xl border border-line-soft bg-white p-4">
                <div className="flex flex-col gap-1">
                  <strong className="text-[15px]">
                    {board.delivered_at ? `${formatDateKo(board.delivered_at)} 전달했어요` : "전달했어요"}
                  </strong>
                  {revealPending ? (
                    <>
                      <span className="text-[13px] text-ink-sub">{formatDateTimeKo(board.reveal_at!)}에 열려요. 링크는 미리 보내도 돼요.</span>
                      <RevealNowButton boardId={board.id} />
                    </>
                  ) : (
                    <span className="text-[13px] text-ink-sub">아래 선물 링크를 {board.recipient_name}에게 보내 주세요.</span>
                  )}
                </div>
                {giftUrl && (
                  <ShareLinkPanel
                    label={`${board.recipient_name}에게 보낼 선물 링크`}
                    url={giftUrl}
                    displayUrl={displayUrl(giftUrl)}
                    qrSvg={giftQr}
                    shareTitle={theme.sceneName(board.recipient_name)}
                  />
                )}
              </section>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Stat label={`모인 ${theme.item}`} value={`${visible}${theme.unit}`} />
              {board.opt_require_approval || pending > 0 ? (
                <Stat label="확인 대기" value={`${pending}개`} />
              ) : (
                <Stat label="주인공" value={board.recipient_name} />
              )}
              <Stat label="마감까지" value={status === "collecting" ? ddayLabel(board.deadline_at) : "마감"} />
            </div>

            {(newCount > 0 || reported > 0 || pending > 0) && (
              <div className="flex flex-col gap-2">
                {reported > 0 && (
                  <Link href={`/boards/${board.id}?tab=messages`} className="flex h-12 items-center gap-2 rounded-xl bg-danger-soft px-4 text-sm font-bold text-danger">
                    신고된 메시지 {reported}개를 확인해 주세요
                  </Link>
                )}
                {pending > 0 && (
                  <Link href={`/boards/${board.id}?tab=messages`} className="flex h-12 items-center gap-2 rounded-xl bg-warn-soft px-4 text-sm font-bold text-warn">
                    확인을 기다리는 메시지가 {pending}개 있어요
                  </Link>
                )}
                {newCount > 0 && (
                  <Link href={`/boards/${board.id}?tab=messages`} className="flex h-12 items-center gap-2 rounded-xl bg-brand-soft px-4 text-sm font-bold text-brand-strong">
                    새 메시지 {newCount}개
                  </Link>
                )}
              </div>
            )}

            {!delivered && (
              <section className="flex flex-col gap-2.5 rounded-2xl border border-line-soft bg-white p-4">
                <span className="text-[13px] font-bold text-ink-sub">참여 링크</span>
                <div className="flex items-center gap-2">
                  <span className="flex-1 truncate text-[15px]">{displayUrl(joinUrl)}</span>
                  <Link href={`/boards/${board.id}/share`} className="flex h-10 items-center rounded-[10px] bg-[#F4F3F8] px-3.5 text-[13px] font-bold">
                    공유하기
                  </Link>
                </div>
              </section>
            )}

            {!delivered && giftUrl && !board.opt_surprise && (
              <section className="flex flex-col gap-3 rounded-2xl border border-dashed border-line bg-white p-4">
                <p className="text-[13px] leading-relaxed text-ink-sub">
                  서프라이즈 모드가 꺼져 있어요. {board.recipient_name}님은 이 링크로 모이는 과정을 실시간으로 볼 수 있어요.
                </p>
                <ShareLinkPanel
                  label="선물 링크"
                  url={giftUrl}
                  displayUrl={displayUrl(giftUrl)}
                  qrSvg={giftQr}
                  shareTitle={theme.sceneName(board.recipient_name)}
                />
              </section>
            )}

            {!delivered && (
              <DeadlineControls
                boardId={board.id}
                today={today}
                currentDeadlineDate={toKSTDate(board.deadline_at)}
                collecting={status === "collecting"}
              />
            )}

            <Link
              href={`/boards/${board.id}/preview`}
              className="flex h-12 items-center justify-center rounded-xl border border-line bg-white text-sm font-bold"
            >
              결과 미리 보기
            </Link>
          </>
        )}

        {tab === "messages" && (
          <MessageManager boardId={board.id} theme={board.theme} messages={messages} seenAt={seenAt} />
        )}

        {tab === "settings" && (
          <SettingsForm
            boardId={board.id}
            title={board.title}
            recipientName={board.recipient_name}
            delivered={delivered}
            initial={{
              optPreviewMessages: board.opt_preview_messages,
              optRequireApproval: board.opt_require_approval,
              optSurprise: board.opt_surprise,
              optPublicResult: board.opt_public_result,
            }}
          />
        )}
      </main>

      {!delivered && tab !== "settings" && (
        <div className="sticky bottom-0 border-t border-line-soft bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
          <DeliverButton
            boardId={board.id}
            recipientName={board.recipient_name}
            sceneName={theme.sceneName(board.recipient_name)}
            surprise={board.opt_surprise}
            messageCount={visible}
            defaultRevealLocal={`${addDays(today, 1)}T09:00`}
          />
        </div>
      )}
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
