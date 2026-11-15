"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sheet } from "@/components/Sheet";
import { ShareLinkPanel } from "@/components/ShareLinkPanel";
import { addDays, formatDateKo } from "@/lib/date";
import { LIMITS } from "@/lib/domain";
import { MAX_DEADLINE_DAYS } from "@/lib/validation";
import { closeBoard, deliverBoard, extendDeadline, revealNow, type ManageResult } from "./actions";

function useAction() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ManageResult>, after?: () => void) => {
    setError("");
    start(async () => {
      const r = await fn();
      if (!r.ok) return setError(r.error);
      after?.();
      router.refresh();
    });
  };
  return { error, pending, run };
}

/** 마감 연장 · 지금 마감 */
export function DeadlineControls({
  boardId,
  today,
  currentDeadlineDate,
  collecting,
}: {
  boardId: string;
  today: string;
  currentDeadlineDate: string;
  collecting: boolean;
}) {
  const [sheet, setSheet] = useState<null | "extend" | "close">(null);
  const initial = currentDeadlineDate > today ? addDays(currentDeadlineDate, 3) : addDays(today, 3);
  const [date, setDate] = useState(initial > addDays(today, MAX_DEADLINE_DAYS) ? addDays(today, MAX_DEADLINE_DAYS) : initial);
  const { error, pending, run } = useAction();

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setSheet("extend")} className="h-12 rounded-xl border border-line bg-white text-sm font-bold">
          {collecting ? "마감 연장" : "다시 모으기"}
        </button>
        <button
          type="button"
          onClick={() => setSheet("close")}
          disabled={!collecting}
          className="h-12 rounded-xl border border-line bg-white text-sm font-bold disabled:text-ink-muted disabled:opacity-60"
        >
          {collecting ? "지금 마감" : "마감됨"}
        </button>
      </div>

      {sheet === "extend" && (
        <Sheet title={collecting ? "마감 연장" : "다시 모으기"} onClose={() => setSheet(null)}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold">새 마감일</span>
            <input
              type="date"
              min={today}
              max={addDays(today, MAX_DEADLINE_DAYS)}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 rounded-xl border border-line px-4 text-base outline-none focus-visible:outline-2 focus-visible:outline-brand"
            />
            <span className="text-[13px] text-ink-sub">{date ? `${formatDateKo(date)} 자정까지 모아요` : ""}</span>
          </label>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button
            type="button"
            disabled={pending || !date}
            onClick={() => run(() => extendDeadline(boardId, date), () => setSheet(null))}
            className="h-12 rounded-xl bg-brand text-[15px] font-bold text-white disabled:opacity-60"
          >
            {pending ? "저장 중…" : "저장"}
          </button>
        </Sheet>
      )}

      {sheet === "close" && (
        <Sheet title="지금 마감할까요?" onClose={() => setSheet(null)}>
          <p className="text-sm leading-relaxed text-ink-sub">마감하면 더 이상 메시지를 받지 않아요. 나중에 ‘다시 모으기’로 되돌릴 수 있어요.</p>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => closeBoard(boardId), () => setSheet(null))}
            className="h-12 rounded-xl bg-ink text-[15px] font-bold text-white disabled:opacity-60"
          >
            {pending ? "마감 중…" : "마감하기"}
          </button>
        </Sheet>
      )}
    </>
  );
}

/** M-04 선물 완성하기 (서프라이즈 보드): 지금 바로 / 예약 공개 */
export function DeliverButton({
  boardId,
  recipientName,
  sceneName,
  surprise,
  messageCount,
  defaultRevealLocal,
}: {
  boardId: string;
  recipientName: string;
  sceneName: string;
  surprise: boolean;
  messageCount: number;
  defaultRevealLocal: string;
}) {
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState<"now" | "later">("now");
  const [reveal, setReveal] = useState(defaultRevealLocal);
  const { error, pending, run } = useAction();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-[54px] w-full rounded-2xl bg-brand text-base font-bold text-white"
      >
        선물 완성하기
      </button>
      {open && (
        <Sheet title={`${sceneName} 완성하기`} onClose={() => setOpen(false)}>
          {surprise && (
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="공개 시점">
              {(
                [
                  ["now", "지금 바로"],
                  ["later", "예약 공개"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={when === k}
                  onClick={() => setWhen(k)}
                  className={`h-12 rounded-xl text-sm ${
                    when === k ? "border-2 border-brand bg-brand-soft font-bold text-brand-strong" : "border border-line font-medium"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {surprise && when === "later" && (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold">공개 시각 (한국 시간)</span>
              <input
                type="datetime-local"
                value={reveal}
                onChange={(e) => setReveal(e.target.value)}
                className="h-12 rounded-xl border border-line px-4 text-base outline-none focus-visible:outline-2 focus-visible:outline-brand"
              />
              <span className="text-[13px] text-ink-sub">
                링크를 미리 보내도, 이 시각 전에는 ‘포장 중’으로 보여요. ({LIMITS.revealMaxDays}일 이내)
              </span>
            </label>
          )}
          {messageCount === 0 && (
            <p className="rounded-xl bg-warn-soft px-4 py-3 text-[13px] text-warn">아직 게시된 메시지가 없어요. 그래도 완성할까요?</p>
          )}
          <p className="text-[13px] leading-relaxed text-ink-sub">
            완성하면 보드가 마감되고 더 이상 메시지를 받지 않아요. 완성한 뒤 나오는 선물 링크를 {recipientName}님에게
            보내야 받을 수 있어요.
          </p>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => deliverBoard(boardId, surprise && when === "later" ? reveal : null), () => setOpen(false))}
            className="h-[54px] rounded-2xl bg-brand text-base font-bold text-white disabled:opacity-60"
          >
            {pending ? "완성하는 중…" : surprise && when === "later" ? "예약하고 선물 링크 받기" : "완성하고 선물 링크 받기"}
          </button>
        </Sheet>
      )}
    </>
  );
}

export function RevealNowButton({ boardId }: { boardId: string }) {
  const { error, pending, run } = useAction();
  return (
    <div className="flex flex-col gap-1">
      <button type="button" disabled={pending} onClick={() => run(() => revealNow(boardId))} className="h-10 self-start rounded-lg px-1 text-[13px] font-bold text-brand underline underline-offset-2 disabled:opacity-60">
        {pending ? "여는 중…" : "지금 바로 열기"}
      </button>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}

/** 서프라이즈 OFF 보드: 선물 링크가 이미 열려 있으므로 공유만 한다 (마감하지 않고 계속 받는다) */
export function SendGiftLinkButton({
  recipientName,
  url,
  displayUrl,
  qrSvg,
  shareTitle,
}: {
  recipientName: string;
  url: string;
  displayUrl: string;
  qrSvg: string;
  shareTitle: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="h-[54px] w-full rounded-2xl bg-brand text-base font-bold text-white">
        {recipientName}에게 선물 링크 보내기
      </button>
      {open && (
        <Sheet title="선물 링크 보내기" onClose={() => setOpen(false)}>
          <p className="text-[13px] leading-relaxed text-ink-sub">
            서프라이즈 모드가 꺼져 있어서 {recipientName}님은 이 링크로 모이는 응원을 실시간으로 볼 수 있어요. 보낸 뒤에도 마감일까지
            계속 메시지를 받아요.
          </p>
          <ShareLinkPanel label={`${recipientName}에게 보낼 선물 링크`} url={url} displayUrl={displayUrl} qrSvg={qrSvg} shareTitle={shareTitle} />
        </Sheet>
      )}
    </>
  );
}
