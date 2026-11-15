"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { CloseIcon } from "@/components/icons";
import { ReportButton } from "@/components/ReportButton";
import { GiftScene, SceneIcon } from "@/components/gift/GiftScene";
import { useSwipe } from "@/components/gift/useSwipe";
import { Logo } from "@/components/Logo";
import { LIMITS, THEMES, type ThemeKey } from "@/lib/domain";
import { SCENE_W } from "@/lib/scene-layout";
import { formatDateKo } from "@/lib/date";
import { themeStyle } from "@/lib/theme-style";
import type { PublicMessage } from "@/lib/types";

export interface GiftViewBoard {
  id: string;
  title: string;
  theme: ThemeKey;
  recipient_name: string;
}

type SaveResult = { ok: true } | { ok: false; error: string; needLogin?: boolean };

const OPENING_BG: Record<string, { bg: string; ink: string; sub: string; btnBg: string; btnInk: string }> = {
  flower: { bg: "#C2375A", ink: "#FFFFFF", sub: "#FFE3EA", btnBg: "#FFFFFF", btnInk: "#9E2846" },
  star: { bg: "#121831", ink: "#FFFFFF", sub: "#C9CEEA", btnBg: "#FFE08A", btnInk: "#121831" },
  note: { bg: "#7A5A30", ink: "#FFFFFF", sub: "#F6E7CF", btnBg: "#FFF8EC", btnInk: "#2B1E10" },
};

/**
 * 주인공이 보는 선물 화면: 오프닝(G-01) → 테마 장면(G-02) ↔ 목록 보기(G-03), 메시지 카드.
 * 개설자 미리 보기(mode="preview")도 같은 화면을 쓴다.
 */
export function GiftView({
  board,
  messages,
  mode,
  giftUrl,
  imageUrl,
  live,
  canSave,
  saved: initiallySaved,
  saveAction,
  participant,
}: {
  board: GiftViewBoard;
  messages: PublicMessage[];
  /** gift: 주인공, preview: 개설자 미리 보기, participant: 참여자 미리 보기 */
  mode: "gift" | "preview" | "participant";
  giftUrl: string | null;
  imageUrl: string | null;
  live: boolean;
  canSave: boolean;
  saved: boolean;
  saveAction?: () => Promise<SaveResult>;
  /** 참여자 미리 보기에서 아래 버튼: 참여 화면으로, 작성하기(모으는 중일 때) */
  participant?: { joinHref: string; writeHref: string | null; recipientName: string };
}) {
  const theme = THEMES[board.theme];
  const ts = themeStyle(board.theme);
  const n = messages.length;
  const router = useRouter();

  // 참여자 미리 보기는 오프닝 없이 바로 장면
  const [phase, setPhase] = useState<"opening" | "scene">(n > 0 && mode !== "participant" ? "opening" : "scene");
  const [tab, setTab] = useState<"scene" | "list">("scene");
  const [listMode, setListMode] = useState<"all" | "one">("all");
  const [oneIdx, setOneIdx] = useState(0);
  // 목록은 최신순이 기본, 과거순으로 바꿀 수 있다
  const [listOrder, setListOrder] = useState<"new" | "old">("new");
  const [open, setOpen] = useState<number | null>(null);
  const [saved, setSaved] = useState(initiallySaved);
  const [saveMsg, setSaveMsg] = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [pending, start] = useTransition();

  // 같은 탭에서 다시 열면 오프닝을 건너뛴다
  const openingKey = `mm_opened_${board.id}`;
  useEffect(() => {
    try {
      if (sessionStorage.getItem(openingKey)) setPhase("scene");
    } catch {}
  }, [openingKey]);

  function enterScene() {
    setPhase("scene");
    try {
      sessionStorage.setItem(openingKey, "1");
    } catch {}
  }

  // 서프라이즈 OFF 로 모으는 중이면 새 메시지를 30초마다 반영
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 30_000);
    return () => clearInterval(t);
  }, [live, router]);

  async function share() {
    if (!giftUrl) return;
    const title = theme.sceneName(board.recipient_name);
    try {
      if (navigator.share) {
        await navigator.share({ title, url: giftUrl });
        return;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(giftUrl);
      setShareMsg("링크를 복사했어요");
    } catch {
      window.prompt("아래 링크를 복사해 주세요", giftUrl);
    }
  }

  function save() {
    if (!saveAction) return;
    setSaveMsg("");
    start(async () => {
      const r = await saveAction();
      if (r.ok) {
        setSaved(true);
        setSaveMsg("내 보드 › 받은 보드에 보관했어요");
      } else if (r.needLogin) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      } else {
        setSaveMsg(r.error);
      }
    });
  }

  if (phase === "opening") {
    const o = OPENING_BG[board.theme] ?? OPENING_BG.note;
    const first = messages[0]?.nickname;
    return (
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col" style={{ background: o.bg, color: o.ink }}>
        <header className="flex h-14 shrink-0 items-center justify-end px-3">
          <button type="button" onClick={enterScene} className="h-11 px-3 text-sm font-medium">
            건너뛰기
          </button>
        </header>
        <main className="mm-fade-in flex flex-1 flex-col items-center justify-center gap-7 px-8 text-center">
          <svg className="mm-float" width="180" height="180" viewBox="0 0 180 180" aria-hidden="true">
            <ellipse cx="90" cy="168" rx="56" ry="7" fill="#000" opacity="0.18" />
            <rect x="34" y="78" width="112" height="84" rx="8" fill="#FFF4F6" />
            <rect x="26" y="60" width="128" height="28" rx="6" fill="#FFFFFF" />
            <rect x="82" y="60" width="16" height="102" fill="#F6C94C" />
            <path d="M90 60 C72 30 46 36 54 54 C58 62 76 62 90 60Z" fill="#F6C94C" />
            <path d="M90 60 C108 30 134 36 126 54 C122 62 104 62 90 60Z" fill="#F6C94C" />
            <circle cx="90" cy="60" r="7" fill="#E0A92E" />
          </svg>
          <div className="flex flex-col gap-3">
            <span className="text-[15px] font-medium" style={{ color: o.sub }}>
              {board.recipient_name}님에게 도착한 선물
            </span>
            <h1 className="whitespace-pre-line font-display text-[28px] font-bold leading-snug">{theme.openingLine(n)}</h1>
            {first && (
              <span className="text-sm" style={{ color: o.sub }}>
                {n > 1 ? `${first} 외 ${n - 1}명이 함께했어요` : `${first}님이 마음을 보냈어요`}
              </span>
            )}
          </div>
        </main>
        <div className="shrink-0 px-5 pb-8 pt-3">
          <button
            type="button"
            onClick={enterScene}
            autoFocus
            className="flex h-14 w-full items-center justify-center rounded-2xl text-[17px] font-bold"
            style={{ background: o.btnBg, color: o.btnInk }}
          >
            선물 열어보기
          </button>
        </div>
      </div>
    );
  }

  // 꽃다발·밤하늘 장면은 기종마다 화면 높이에 맞춰 한 화면에 다 보이게 한다 (넓게 펼친 장면·쪽지 벽·목록은 스크롤)
  const fit = tab === "scene" && n > 0 && n < LIMITS.sceneExpandAt && board.theme !== "note";

  return (
    <div
      className={`mx-auto flex max-w-[480px] flex-col ${fit ? "h-dvh overflow-hidden" : "min-h-dvh"}`}
      style={{ background: ts.bg, color: ts.ink }}
    >
      {mode === "participant" && participant && (
        <div className="flex items-center justify-between gap-2 bg-ink px-4 py-2.5 text-[13px] text-white">
          <span>미리 보기예요. {participant.recipientName}님에게는 마감 후 이렇게 전달돼요.</span>
        </div>
      )}
      {mode === "preview" && (
        <div className="flex items-center justify-between gap-2 bg-ink px-4 py-2.5 text-[13px] text-white">
          <span>미리 보기예요. 전달하면 주인공에게 이렇게 보여요.</span>
          <span className="flex shrink-0 gap-3">
            <Link href={`/boards/${board.id}`} className="font-bold underline underline-offset-2">
              보드 관리
            </Link>
            <Link href="/me" className="font-bold underline underline-offset-2">
              내 보드
            </Link>
          </span>
        </div>
      )}

      <header
        className="sticky top-0 z-10 flex shrink-0 flex-col gap-3 px-5 pb-3 pt-3 short:gap-2 short:pb-2"
        style={{ background: ts.headerBg }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1 short:gap-0.5">
            <Link href="/" className="flex items-center gap-1 self-start text-xs font-bold" style={{ color: ts.sub }} aria-label="마음모아 홈">
              <Logo size={14} />
              마음모아
            </Link>
            <span className="text-[13px] font-medium" style={{ color: ts.sub }}>
              {n > 0 ? theme.countLine(n) : `아직 ${theme.item}이 없어요`}
              {live && " · 실시간"}
            </span>
            <h1 className="font-display text-2xl font-bold leading-snug short:text-xl">{board.title}</h1>
          </div>
          {canSave && (
            <button
              type="button"
              onClick={save}
              disabled={saved || pending}
              className="h-10 shrink-0 rounded-full px-3.5 text-[13px] font-bold disabled:opacity-70"
              style={{ background: ts.btnBg, color: ts.btnInk, border: `1px solid ${ts.btnBorder}` }}
            >
              {saved ? "보관됨" : pending ? "보관 중…" : "보관하기"}
            </button>
          )}
        </div>
        {saveMsg && (
          <p role="status" className="text-[13px]" style={{ color: ts.sub }}>
            {saveMsg}
          </p>
        )}
        <div role="tablist" aria-label="보기 방식" className="grid grid-cols-2 rounded-xl p-1" style={{ background: ts.segBg }}>
          {(
            [
              ["scene", theme.sceneLabel],
              ["list", "목록 보기"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className="h-10 rounded-[9px] text-sm short:h-9"
              style={{
                background: tab === key ? ts.segOn : "transparent",
                fontWeight: tab === key ? 700 : 500,
                color: tab === key ? (ts.dark ? "#FFFFFF" : ts.ink) : ts.sub,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        {n === 0 ? (
          <p className="flex flex-1 items-center justify-center px-8 py-20 text-center text-sm" style={{ color: ts.sub }}>
            {live ? "친구들이 마음을 모으고 있어요. 조금만 기다려 주세요." : "아직 도착한 메시지가 없어요."}
          </p>
        ) : tab === "scene" ? (
          fit ? (
            <>
              {/* 남은 높이 안에 장면을 비율 그대로 최대한 크게 */}
              <div className="flex min-h-0 flex-1 items-center justify-center" style={{ containerType: "size" }}>
                <div style={{ width: `min(100cqw, calc(100cqh * ${SCENE_W} / 470))` }}>
                  <GiftScene theme={board.theme} messages={messages} seed={board.id} onOpen={setOpen} />
                </div>
              </div>
              <p className="shrink-0 pb-1 text-center text-[13px]" style={{ color: ts.sub }}>
                {theme.tapHint}
              </p>
            </>
          ) : (
            <>
              <GiftScene theme={board.theme} messages={messages} seed={board.id} onOpen={setOpen} />
              {board.theme !== "note" && (
                <p className="pb-2 text-center text-[13px]" style={{ color: ts.sub }}>
                  {theme.tapHint}
                </p>
              )}
            </>
          )
        ) : (
          <ListView
            theme={board.theme}
            messages={messages}
            mode={listMode}
            setMode={setListMode}
            idx={oneIdx}
            setIdx={setOneIdx}
            order={listOrder}
            setOrder={(o) => {
              setListOrder(o);
              setOneIdx(0);
            }}
          />
        )}
      </main>

      {mode === "participant" && participant ? (
        <div
          className={`sticky bottom-0 grid shrink-0 gap-2 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 short:pt-2 ${participant.writeHref ? "grid-cols-2" : "grid-cols-1"}`}
          style={{ background: ts.headerBg }}
        >
          <Link
            href={participant.joinHref}
            className="flex h-[52px] items-center justify-center rounded-2xl text-sm font-bold short:h-12"
            style={{ background: ts.btnBg, color: ts.btnInk, border: `1px solid ${ts.btnBorder}` }}
          >
            참여 화면으로
          </Link>
          {participant.writeHref && (
            <Link
              href={participant.writeHref}
              className="flex h-[52px] items-center justify-center rounded-2xl text-sm font-bold short:h-12"
              style={{ background: ts.primaryBg, color: ts.primaryInk }}
            >
              {theme.writeCta}
            </Link>
          )}
        </div>
      ) : (
      <div
        className="sticky bottom-0 grid shrink-0 grid-cols-3 gap-2 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 short:pt-2"
        style={{ background: ts.headerBg }}
      >
        {imageUrl ? (
          <a
            href={imageUrl}
            download
            className="flex h-[52px] items-center justify-center gap-1.5 rounded-2xl text-sm font-bold short:h-12"
            style={{ background: ts.btnBg, color: ts.btnInk, border: `1px solid ${ts.btnBorder}` }}
          >
            <DownloadIcon />
            저장
          </a>
        ) : (
          <span />
        )}
        {giftUrl ? (
          <button
            type="button"
            onClick={share}
            className="flex h-[52px] items-center justify-center gap-1.5 rounded-2xl text-sm font-bold short:h-12"
            style={{ background: ts.btnBg, color: ts.btnInk, border: `1px solid ${ts.btnBorder}` }}
          >
            <ShareIcon />
            {shareMsg ? "복사됨" : "공유"}
          </button>
        ) : (
          <span />
        )}
        <Link
          href="/"
          className="flex h-[52px] items-center justify-center rounded-2xl text-sm font-bold short:h-12"
          style={{ background: ts.primaryBg, color: ts.primaryInk }}
        >
          나도 만들기
        </Link>
      </div>
      )}

      {open !== null && messages[open] && (
        <MessageModal
          theme={board.theme}
          messages={messages}
          index={open}
          setIndex={setOpen}
          reportable={mode !== "preview"}
        />
      )}
    </div>
  );
}

function ListView({
  theme,
  messages,
  mode,
  setMode,
  idx,
  setIdx,
  order,
  setOrder,
}: {
  theme: ThemeKey;
  messages: PublicMessage[];
  mode: "all" | "one";
  setMode: (m: "all" | "one") => void;
  idx: number;
  setIdx: (i: number) => void;
  order: "new" | "old";
  setOrder: (o: "new" | "old") => void;
}) {
  const ts = themeStyle(theme);
  const n = messages.length;
  // 서버는 오래된 순으로 준다. 꾸밈 색이 장면과 같도록 원래 순서(i)를 같이 들고 다닌다.
  const items = messages.map((m, i) => ({ m, i }));
  if (order === "new") items.reverse();
  const curItem = items[Math.min(idx, n - 1)];
  const cur = curItem.m;
  const swipe = useSwipe(
    () => setIdx((idx - 1 + n) % n),
    () => setIdx((idx + 1) % n),
    n > 1,
  );
  const chip = (on: boolean): React.CSSProperties => ({
    background: on ? (ts.dark ? "#FFFFFF" : "#1F1D2B") : ts.btnBg,
    color: on ? (ts.dark ? "#121831" : "#FFFFFF") : ts.btnInk,
    border: on ? "0" : `1px solid ${ts.btnBorder}`,
    fontWeight: on ? 700 : 500,
  });
  return (
    <div className="flex flex-1 flex-col gap-4 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-pressed={mode === "all"} onClick={() => setMode("all")} className="h-9 rounded-full px-3.5 text-[13px]" style={chip(mode === "all")}>
          모아 보기
        </button>
        <button type="button" aria-pressed={mode === "one"} onClick={() => setMode("one")} className="h-9 rounded-full px-3.5 text-[13px]" style={chip(mode === "one")}>
          한 장씩 넘겨 보기
        </button>
        <div role="group" aria-label="정렬" className="ml-auto flex rounded-full p-0.5" style={{ background: ts.segBg }}>
          {(
            [
              ["new", "최신순"],
              ["old", "과거순"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={order === k}
              onClick={() => setOrder(k)}
              className="h-8 rounded-full px-3 text-xs"
              style={{
                background: order === k ? ts.segOn : "transparent",
                color: order === k ? (ts.dark ? "#FFFFFF" : ts.ink) : ts.sub,
                fontWeight: order === k ? 700 : 500,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {mode === "all" ? (
        <ul className="flex flex-col gap-2.5">
          {items.map(({ m, i }) => (
            <li key={m.id} className="flex gap-3 rounded-2xl p-4" style={{ background: ts.cardBg, color: ts.cardInk }}>
              <SceneIcon theme={theme} style={m.style} index={i} size={26} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-baseline justify-between gap-2">
                  <strong className="text-[13px]">{m.nickname}</strong>
                  {m.created_at && (
                    <span className="shrink-0 text-[11px] opacity-70">{formatDateKo(m.created_at)}</span>
                  )}
                </span>
                <p className="whitespace-pre-line text-[15px] leading-relaxed">{m.body}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
          <div
            className="flex w-full select-none flex-col items-center gap-4 rounded-3xl px-6 py-8 text-center"
            style={{ background: ts.cardBg, color: ts.cardInk, ...swipe.style }}
            {...swipe.handlers}
          >
            <SceneIcon theme={theme} style={cur.style} index={curItem.i} size={56} />
            <p className="min-h-24 whitespace-pre-line font-display text-lg leading-relaxed">{cur.body}</p>
            <strong className="text-sm">{cur.nickname}</strong>
          </div>
          <Pager n={n} idx={idx} onPrev={() => swipe.go(-1)} onNext={() => swipe.go(1)} theme={theme} />
        </div>
      )}
    </div>
  );
}

function Pager({ n, idx, onPrev, onNext, theme }: { n: number; idx: number; onPrev: () => void; onNext: () => void; theme: ThemeKey }) {
  const ts = themeStyle(theme);
  const btn: React.CSSProperties = { border: `1px solid ${ts.btnBorder}`, color: ts.dark ? "#FFFFFF" : ts.ink, background: "transparent" };
  return (
    <div className="flex w-full items-center justify-between">
      <button type="button" aria-label="이전 메시지" onClick={onPrev} className="flex h-11 w-11 items-center justify-center rounded-full" style={btn}>
        <Chevron dir="left" />
      </button>
      <span className="text-[13px]" style={{ color: ts.sub }} aria-live="polite">
        {idx + 1} / {n}
      </span>
      <button type="button" aria-label="다음 메시지" onClick={onNext} className="flex h-11 w-11 items-center justify-center rounded-full" style={btn}>
        <Chevron dir="right" />
      </button>
    </div>
  );
}

function MessageModal({
  theme,
  messages,
  index,
  setIndex,
  reportable,
}: {
  theme: ThemeKey;
  messages: PublicMessage[];
  index: number;
  setIndex: (i: number | null) => void;
  reportable: boolean;
}) {
  const ts = themeStyle(theme);
  const n = messages.length;
  const m = messages[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setIndex(null), [setIndex]);
  const swipe = useSwipe(
    () => setIndex((index - 1 + n) % n),
    () => setIndex((index + 1) % n),
    n > 1,
  );
  const { go } = swipe;

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, go]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${m.nickname}님의 메시지`}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: ts.dim }}
      onClick={close}
    >
      <div
        className="mm-fade-in flex w-full max-w-[420px] select-none flex-col gap-3.5 rounded-[22px] px-[22px] pb-[18px] pt-[18px] shadow-[0_18px_40px_rgba(0,0,0,0.25)]"
        style={{ background: ts.cardBg, color: ts.cardInk, border: ts.dark ? `1px solid ${ts.btnBorder}` : undefined, ...swipe.style }}
        onClick={(e) => e.stopPropagation()}
        {...swipe.handlers}
      >
        <div className="flex items-center justify-between">
          <span className="flex min-w-0 items-center gap-2.5">
            <SceneIcon theme={theme} style={m.style} index={index} size={34} />
            <strong className="truncate text-base">{m.nickname}</strong>
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="닫기"
            className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full opacity-60 hover:opacity-100 focus-visible:opacity-100"
          >
            <CloseIcon size={16} />
          </button>
        </div>
        <p className="min-h-[92px] whitespace-pre-line font-display text-lg leading-[1.7]">{m.body}</p>
        <Pager n={n} idx={index} onPrev={() => go(-1)} onNext={() => go(1)} theme={theme} />
        {n > 1 && (
          <p className="-mt-1 text-center text-[11px]" style={{ color: ts.sub }}>
            옆으로 밀어서 넘길 수 있어요
          </p>
        )}
        {reportable && (
          <div className="flex justify-end">
            <ReportButton messageId={m.id} compact color={ts.sub} />
          </div>
        )}
      </div>
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}
