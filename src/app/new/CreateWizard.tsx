"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { BackIcon } from "@/components/icons";
import { ThemeSwatch } from "@/components/ThemeSwatch";
import { ToggleRow } from "@/components/Toggle";
import { LIMITS, OCCASIONS, THEMES, getOccasion, type OccasionKey, type ThemeKey } from "@/lib/domain";
import { addDays, formatDateKo } from "@/lib/date";
import { MAX_DEADLINE_DAYS, type CreateBoardInput } from "@/lib/validation";
import { createBoard } from "./actions";

const THEME_ORDER: ThemeKey[] = ["flower", "star", "note", "light", "letter"];
const STEP_COUNT = 4;

function suggestTitle(name: string, occasion: OccasionKey) {
  const n = name.trim() || "주인공";
  switch (occasion) {
    case "birthday":
      return `${n}의 생일`;
    case "pass":
      return `${n}의 합격을 축하해`;
    case "leave":
      return `${n}의 새 출발을 응원해`;
    case "cheer":
      return `${n}에게 보내는 응원`;
    case "coworker":
      return `고마운 ${n}에게`;
    default:
      return `${n}에게`;
  }
}

const DUE_PRESETS = [
  { key: "d3", label: "3일 후", days: 3 },
  { key: "d7", label: "일주일 후", days: 7 },
  { key: "d14", label: "2주 후", days: 14 },
] as const;

const chip = (on: boolean) =>
  `h-12 rounded-xl text-sm ${
    on ? "border-2 border-brand bg-brand-soft font-bold text-brand-strong" : "border border-line bg-white font-medium"
  }`;

const inputCls =
  "h-[52px] rounded-xl border border-line px-4 text-base outline-none focus-visible:outline-2 focus-visible:outline-brand";

export function CreateWizard({ today }: { today: string }) {
  const [step, setStep] = useState(1);
  const [recipientName, setRecipientName] = useState("");
  const [occasion, setOccasion] = useState<OccasionKey>("birthday");
  const [theme, setTheme] = useState<ThemeKey>("flower");
  const [themeTouched, setThemeTouched] = useState(false);
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [intro, setIntro] = useState("");
  const [duePreset, setDuePreset] = useState<string>("d7");
  const [deadlineDate, setDeadlineDate] = useState(addDays(today, 7));
  const [opts, setOpts] = useState({
    optPreviewMessages: true,
    optRequireApproval: false,
    optSurprise: getOccasion("birthday").defaultSurprise,
    optPublicResult: true,
  });
  const [surpriseTouched, setSurpriseTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const occ = getOccasion(occasion);
  const effectiveTitle = titleTouched ? title : suggestTitle(recipientName, occasion);

  function pickOccasion(key: OccasionKey) {
    const o = getOccasion(key);
    setOccasion(key);
    // 사용자가 직접 고른 값은 덮어쓰지 않는다
    if (!themeTouched) setTheme(o.recommendedTheme);
    if (!surpriseTouched) setOpts((p) => ({ ...p, optSurprise: o.defaultSurprise }));
  }

  function validateStep(s: number): string | null {
    if (s === 1 && !recipientName.trim()) return "주인공 이름을 입력해 주세요.";
    if (s === 3) {
      if (!effectiveTitle.trim()) return "보드 제목을 입력해 주세요.";
      if (!deadlineDate) return "마감일을 골라 주세요.";
    }
    return null;
  }

  function next() {
    const msg = validateStep(step);
    if (msg) return setError(msg);
    setError(null);
    setStep((s) => Math.min(STEP_COUNT, s + 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function submit() {
    const input: CreateBoardInput = {
      recipientName,
      occasion,
      theme,
      title: effectiveTitle,
      intro,
      deadlineDate,
      ...opts,
    };
    setError(null);
    startTransition(async () => {
      const res = await createBoard(input);
      // 성공하면 서버 액션이 공유 화면으로 이동시킨다. 여기 도달하면 실패한 것.
      if (res && !res.ok) {
        setError(res.error);
        if (res.field === "recipientName") setStep(1);
        else if (res.field === "theme") setStep(2);
        else if (res.field === "title" || res.field === "intro" || res.field === "deadlineDate") setStep(3);
      }
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center gap-1 px-2">
        {step === 1 ? (
          <Link href="/" aria-label="뒤로" className="flex h-11 w-11 items-center justify-center">
            <BackIcon />
          </Link>
        ) : (
          <button type="button" onClick={back} aria-label="이전 단계" className="flex h-11 w-11 items-center justify-center">
            <BackIcon />
          </button>
        )}
        <span className="text-base font-bold">보드 만들기</span>
        <span className="ml-auto pr-4 text-[13px] text-ink-muted">
          {step} / {STEP_COUNT}
        </span>
      </header>
      <div className="h-1 shrink-0 bg-line-soft" aria-hidden="true">
        <div className="h-1 bg-brand transition-[width]" style={{ width: `${(step / STEP_COUNT) * 100}%` }} />
      </div>

      <main className="flex flex-1 flex-col gap-6 px-5 pb-6 pt-7">
        {step === 1 && (
          <>
            <h1 className="font-display text-2xl font-bold leading-snug">
              누구를 위한
              <br />
              보드인가요?
            </h1>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold">주인공 이름</span>
              <input
                className={inputCls}
                value={recipientName}
                maxLength={LIMITS.recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="예: 지수"
                autoFocus
              />
            </label>
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2.5 text-sm font-bold">어떤 날인가요?</legend>
              <div className="grid grid-cols-3 gap-2">
                {OCCASIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    aria-pressed={occasion === o.key}
                    onClick={() => pickOccasion(o.key)}
                    className={chip(occasion === o.key)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex flex-col gap-2">
              <h1 className="font-display text-2xl font-bold leading-snug">
                어떤 모습으로
                <br />
                마음을 모을까요?
              </h1>
              <p className="text-sm text-ink-sub">
                {occ.label}에는 {THEMES[occ.recommendedTheme].label} 테마가 잘 어울려요.
              </p>
            </div>
            <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="테마">
              {THEME_ORDER.map((key) => {
                const t = THEMES[key];
                const on = theme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={!t.available}
                    onClick={() => {
                      setTheme(key);
                      setThemeTouched(true);
                    }}
                    className={`flex items-center gap-3.5 rounded-2xl p-3.5 text-left ${
                      on ? "border-2 border-brand bg-brand-soft" : "border border-line bg-white"
                    } ${t.available ? "" : "opacity-55"}`}
                  >
                    <ThemeSwatch theme={key} />
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="flex items-center gap-1.5 text-[15px] font-bold">
                        {t.label}
                        {key === occ.recommendedTheme && (
                          <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">추천</span>
                        )}
                        {!t.available && (
                          <span className="rounded-full bg-line-soft px-2 py-0.5 text-[11px] font-bold text-ink-sub">
                            곧 출시
                          </span>
                        )}
                      </span>
                      <span className="text-[13px] text-ink-sub">{t.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="font-display text-2xl font-bold leading-snug">
              보드를
              <br />
              소개해 주세요
            </h1>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold">보드 제목</span>
              <input
                className={inputCls}
                value={effectiveTitle}
                maxLength={LIMITS.title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleTouched(true);
                }}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="flex justify-between text-sm font-bold">
                참여자에게 한마디
                <span className="font-normal text-ink-muted">
                  {intro.length} / {LIMITS.intro}
                </span>
              </span>
              <textarea
                rows={3}
                value={intro}
                maxLength={LIMITS.intro}
                onChange={(e) => setIntro(e.target.value)}
                placeholder={`예: ${recipientName.trim() || "주인공"} 몰래 준비하는 선물이에요. ${THEMES[theme].writeCta} 해 주세요!`}
                className="resize-none rounded-xl border border-line px-4 py-3.5 text-[15px] leading-normal outline-none focus-visible:outline-2 focus-visible:outline-brand"
              />
            </label>
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2.5 text-sm font-bold">언제까지 모을까요?</legend>
              <div className="grid grid-cols-2 gap-2">
                {DUE_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    aria-pressed={duePreset === p.key}
                    onClick={() => {
                      setDuePreset(p.key);
                      setDeadlineDate(addDays(today, p.days));
                    }}
                    className={chip(duePreset === p.key)}
                  >
                    {p.label}
                  </button>
                ))}
                <label className={`${chip(duePreset === "custom")} relative flex items-center justify-center`}>
                  직접 선택
                  <input
                    type="date"
                    min={today}
                    max={addDays(today, MAX_DEADLINE_DAYS)}
                    value={deadlineDate}
                    onChange={(e) => {
                      setDuePreset("custom");
                      setDeadlineDate(e.target.value);
                    }}
                    className="absolute inset-0 opacity-0"
                    aria-label="마감일 직접 선택"
                  />
                </label>
              </div>
              <span className="text-[13px] text-ink-muted">
                마감: {deadlineDate ? `${formatDateKo(deadlineDate)} 자정` : "날짜를 골라 주세요"}
              </span>
            </fieldset>
          </>
        )}

        {step === 4 && (
          <>
            <div className="flex flex-col gap-2">
              <h1 className="font-display text-2xl font-bold leading-snug">보드 설정</h1>
              <p className="text-sm text-ink-sub">만든 뒤에도 보드 관리에서 바꿀 수 있어요.</p>
            </div>
            <div className="flex flex-col">
              <ToggleRow
                label="다른 사람 메시지 미리 보기"
                description="참여자가 작성 전후로 다른 메시지를 볼 수 있어요"
                checked={opts.optPreviewMessages}
                onChange={(v) => setOpts((p) => ({ ...p, optPreviewMessages: v }))}
              />
              <ToggleRow
                label="승인 후 게시"
                description="내가 확인한 메시지만 보드에 보여요"
                checked={opts.optRequireApproval}
                onChange={(v) => setOpts((p) => ({ ...p, optRequireApproval: v }))}
              />
              <ToggleRow
                label="서프라이즈 모드"
                description={
                  opts.optSurprise
                    ? `마감 후 '전달하기'를 누를 때 ${recipientName.trim() || "주인공"}에게 완성된 선물을 보내요`
                    : `${recipientName.trim() || "주인공"}에게 선물 링크를 먼저 보내, 모이는 과정을 실시간으로 볼 수 있어요`
                }
                checked={opts.optSurprise}
                onChange={(v) => {
                  setOpts((p) => ({ ...p, optSurprise: v }));
                  setSurpriseTouched(true);
                }}
              />
              <ToggleRow
                label="결과 페이지 공개"
                description="선물 링크가 있으면 누구나 볼 수 있어요"
                checked={opts.optPublicResult}
                onChange={(v) => setOpts((p) => ({ ...p, optPublicResult: v }))}
              />
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
      </main>

      <div className="sticky bottom-0 border-t border-line-soft bg-white px-5 pb-6 pt-3">
        {step < STEP_COUNT ? (
          <button
            type="button"
            onClick={next}
            className="h-[54px] w-full rounded-2xl bg-brand text-base font-bold text-white"
          >
            다음
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="h-[54px] w-full rounded-2xl bg-brand text-base font-bold text-white disabled:opacity-60"
          >
            {pending ? "만드는 중…" : "보드 만들기"}
          </button>
        )}
      </div>
    </div>
  );
}
