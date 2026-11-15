import "server-only";
import { ImageResponse } from "next/og";
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { ThemeHeroArt } from "@/components/ThemeHero";
import { FlowerShape, NoteShape, StarShape } from "@/components/shapes";
import { THEMES } from "@/lib/domain";
import { josa } from "@/lib/josa";
import { loadOgFonts, ogFontFamily, type OgFont } from "@/lib/server/og-font";
import { themeStyle } from "@/lib/theme-style";
import type { BoardRow, PublicMessage } from "@/lib/types";
import { resolveVariant } from "@/lib/variants";

/**
 * 서버에서 그리는 이미지들 (Satori).
 * - 참여 링크 미리보기: 카카오톡·메신저에 링크를 붙이면 보이는 카드 (보드 제목 그대로)
 * - 선물 링크 미리보기: 메시지 내용은 드러내지 않는다
 * - 결과 이미지 저장: 메시지를 모은 세로 포스터
 * Satori 규칙: 자식이 둘 이상인 div 는 display:flex 가 필요하고, 글자는 하나의 문자열로 넘긴다.
 */
export const OG_SIZE = { width: 1200, height: 630 };

/** Satori 는 <svg> 안에 컴포넌트를 못 쓰므로, 함수 컴포넌트를 펼쳐 기본 SVG 요소만 남긴다 */
export function flatten(node: ReactNode): ReactNode {
  if (Array.isArray(node)) return node.map(flatten);
  if (!isValidElement(node)) return node;
  const el = node as ReactElement<{ children?: ReactNode }>;
  if (typeof el.type === "function") {
    return flatten((el.type as (p: unknown) => ReactNode)(el.props));
  }
  const children = el.props.children;
  if (children === undefined) return el;
  return cloneElement(el, undefined, ...Children.toArray(children).map(flatten));
}

/** 이모지는 외부 CDN 이 필요해서 이미지에서는 뺀다 (화면에서는 그대로 보인다) */
const stripEmoji = (t: string) => t.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "").replace(/ {2,}/g, " ").trim();

/** 서비스 대표 미리보기 (홈 주소를 카톡 등에 붙였을 때) */
export async function homeOgImage() {
  const lines = ["모두의 마음을 모아", "한 사람에게 선물해요"];
  const sub = "응원 메시지를 모아 꽃다발·밤하늘·쪽지 벽으로";
  const title = lines.join("");
  const fonts = await loadOgFonts(`마음모아${title}${sub}한사람을위한응원보드`);
  const tile = (bg: string, theme: "flower" | "star" | "note") => (
    <div style={{ display: "flex", width: 150, height: 150, borderRadius: 28, background: bg, alignItems: "center", justifyContent: "center" }}>
      {flatten(<ThemeHeroArt theme={theme} width={128} />)}
    </div>
  );
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#FFFFFF",
          fontFamily: ogFontFamily(fonts),
          padding: "64px 72px",
          alignItems: "center",
          gap: 56,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width="56" height="56" viewBox="0 0 26 26">
              <circle cx="9" cy="10" r="6" fill="#C2375A" />
              <circle cx="17" cy="10" r="6" fill="#F08A9E" />
              <circle cx="13" cy="17" r="6" fill="#F6C94C" opacity="0.92" />
            </svg>
            <div style={{ display: "flex", fontSize: 44, color: "#1F1D2B" }}>마음모아</div>
          </div>
          <div style={{ display: "flex", alignSelf: "flex-start", padding: "8px 18px", borderRadius: 999, background: "#FCE8EC", color: "#C2375A", fontSize: 26 }}>
            한 사람을 위한 응원 보드
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 60, lineHeight: 1.35, color: "#1F1D2B" }}>
            {lines.map((l) => (
              <div key={l} style={{ display: "flex" }}>
                {l}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#5E5A6E", wordBreak: "keep-all" }}>{sub}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {tile("#FCE8EC", "flower")}
          <div style={{ display: "flex", gap: 18 }}>
            {tile("#121831", "star")}
            {tile("#D2B184", "note")}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts as OgFont[] },
  );
}

const HERO_BG: Record<string, string> = { flower: "#FCE8EC", star: "#121831", note: "#C9A574" };

export async function joinOgImage(board: BoardRow, count: number) {
  const theme = THEMES[board.theme];
  const ts = themeStyle(board.theme);
  const sub = count > 0 ? theme.countLine(count) : `${josa(board.recipient_name, "이에게/에게")} 마음을 보내 주세요`;
  const fonts = await loadOgFonts(`마음모아${board.title}${sub}${theme.writeCta}`);
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: HERO_BG[board.theme] ?? ts.bg,
          color: ts.ink,
          fontFamily: ogFontFamily(fonts),
          padding: "64px 72px",
          alignItems: "center",
          gap: 48,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 24 }}>
          <div style={{ display: "flex", fontSize: 32, color: ts.sub }}>마음모아</div>
          <div style={{ display: "flex", fontSize: 68, lineHeight: 1.3, wordBreak: "keep-all" }}>{board.title}</div>
          <div style={{ display: "flex", fontSize: 34, color: ts.sub }}>{sub}</div>
          <div style={{ display: "flex", marginTop: 16 }}>
            <div
              style={{
                display: "flex",
                padding: "18px 36px",
                borderRadius: 999,
                background: board.theme === "flower" ? "#C2375A" : ts.primaryBg,
                color: board.theme === "flower" ? "#FFFFFF" : ts.primaryInk,
                fontSize: 34,
              }}
            >
              {theme.writeCta}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", width: 400, justifyContent: "center" }}>
          {flatten(<ThemeHeroArt theme={board.theme} width={400} />)}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts as OgFont[] },
  );
}

const GIFT_BG: Record<string, { bg: string; ink: string; sub: string }> = {
  flower: { bg: "#C2375A", ink: "#FFFFFF", sub: "#FFE3EA" },
  star: { bg: "#121831", ink: "#FFFFFF", sub: "#C9CEEA" },
  note: { bg: "#7A5A30", ink: "#FFFFFF", sub: "#F6E7CF" },
};

export async function giftOgImage(board: BoardRow) {
  const theme = THEMES[board.theme];
  const c = GIFT_BG[board.theme] ?? GIFT_BG.note;
  const line1 = `${board.recipient_name}님에게 도착한 선물`;
  const line2 = theme.sceneName(board.recipient_name);
  const fonts = await loadOgFonts(`마음모아${line1}${line2}`);
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: c.bg,
          color: c.ink,
          fontFamily: ogFontFamily(fonts),
          alignItems: "center",
          justifyContent: "center",
          gap: 64,
        }}
      >
        <svg width="260" height="260" viewBox="0 0 180 180">
          <rect x="34" y="78" width="112" height="84" rx="8" fill="#FFF4F6" />
          <rect x="26" y="60" width="128" height="28" rx="6" fill="#FFFFFF" />
          <rect x="82" y="60" width="16" height="102" fill="#F6C94C" />
          <path d="M90 60 C72 30 46 36 54 54 C58 62 76 62 90 60Z" fill="#F6C94C" />
          <path d="M90 60 C108 30 134 36 126 54 C122 62 104 62 90 60Z" fill="#F6C94C" />
          <circle cx="90" cy="60" r="7" fill="#E0A92E" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 32, color: c.sub }}>마음모아</div>
          <div style={{ display: "flex", fontSize: 64, wordBreak: "keep-all" }}>{line1}</div>
          <div style={{ display: "flex", fontSize: 38, color: c.sub }}>{line2}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts as OgFont[] },
  );
}

// ─────────────────────────────────────────────
// 결과 포스터 (이미지 저장)
// ─────────────────────────────────────────────
const POSTER_W = 1080;
const PAD = 64;
const GAP = 24;
const COL_W = (POSTER_W - PAD * 2 - GAP) / 2;
const MAX_MESSAGES = 24;
const MAX_BODY = 120;

function shapeSvg(board: BoardRow, m: PublicMessage, i: number, size: number) {
  const v = resolveVariant(board.theme, m.style, i);
  return flatten(
    <svg width={size} height={size} viewBox="-24 -24 48 48">
      {board.theme === "flower" ? <FlowerShape v={v} /> : board.theme === "star" ? <StarShape v={v} /> : <NoteShape v={v} />}
    </svg>,
  );
}

export async function posterImage(board: BoardRow, messages: PublicMessage[]) {
  const theme = THEMES[board.theme];
  const ts = themeStyle(board.theme);
  const isNote = board.theme === "note";
  const shown = messages.slice(0, MAX_MESSAGES).map((m) => {
    const body = stripEmoji(m.body) || " ";
    return { ...m, nickname: stripEmoji(m.nickname) || " ", body: body.length > MAX_BODY ? `${body.slice(0, MAX_BODY)}…` : body };
  });
  const rest = messages.length - shown.length;
  const countLine = theme.countLine(messages.length);
  const footer = rest > 0 ? `외 ${rest}개의 메시지가 더 있어요 · 마음모아` : "마음모아로 모은 마음";

  const bodySize = isNote ? 40 : 28;
  // 실제 글자 폭으로 잰 값 (고운돋움 ≈ 0.72em, 나눔손글씨 펜 ≈ 0.5em). 조금 넉넉하게 잡는다.
  const charsPerLine = Math.floor((COL_W - 56) / (bodySize * (isNote ? 0.55 : 0.78)));
  const lineH = Math.round(bodySize * 1.5);
  const cardH = (body: string) =>
    56 + 44 + 12 + body.split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / charsPerLine)), 0) * lineH;

  // 짧은 쪽 열에 차례로 쌓기
  const cols: { items: (typeof shown)[number][]; h: number }[] = [
    { items: [], h: 0 },
    { items: [], h: 0 },
  ];
  shown.forEach((m) => {
    const c = cols[0].h <= cols[1].h ? cols[0] : cols[1];
    c.items.push(m);
    c.h += cardH(m.body) + GAP;
  });
  const headerH = 420;
  const height = Math.min(9000, Math.ceil(PAD + headerH + Math.max(cols[0].h, cols[1].h, 200) + 120));

  const allText = `마음모아${board.title}${countLine}${footer}${shown.map((m) => m.nickname + m.body).join("")}`;
  const [sans, pen] = await Promise.all([
    loadOgFonts(allText),
    isNote ? loadOgFonts(shown.map((m) => m.body + m.nickname).join(""), "Nanum Pen Script") : Promise.resolve([] as OgFont[]),
  ]);
  const penFonts = pen.map((f, i) => ({ ...f, name: `MP${i}` }));
  const sansFamily = ogFontFamily(sans);
  const penFamily = penFonts.length ? `${ogFontFamily(penFonts)}, ${sansFamily}` : sansFamily;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: ts.bg,
          color: ts.ink,
          fontFamily: sansFamily,
          padding: PAD,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 32, height: headerH - 40, marginBottom: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 16 }}>
            <div style={{ display: "flex", fontSize: 30, color: ts.sub }}>{countLine}</div>
            <div style={{ display: "flex", fontSize: 64, lineHeight: 1.3, wordBreak: "keep-all" }}>{board.title}</div>
          </div>
          {flatten(<ThemeHeroArt theme={board.theme} width={320} />)}
        </div>
        <div style={{ display: "flex", gap: GAP, flex: 1 }}>
          {cols.map((col, ci) => (
            <div key={ci} style={{ display: "flex", flexDirection: "column", gap: GAP, width: COL_W }}>
              {col.items.map((m) => {
                const i = messages.indexOf(messages.find((x) => x.id === m.id)!);
                const v = resolveVariant(board.theme, m.style, i);
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      padding: 28,
                      borderRadius: isNote ? 4 : 24,
                      background: isNote ? v.color : ts.cardBg,
                      color: isNote ? "#2B2620" : ts.cardInk,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, height: 44 }}>
                      {shapeSvg(board, m, i, 40)}
                      <div style={{ display: "flex", fontSize: 26 }}>{m.nickname}</div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: bodySize,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                        wordBreak: "keep-all",
                        fontFamily: isNote ? penFamily : sansFamily,
                      }}
                    >
                      {m.body}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", fontSize: 26, color: ts.sub, marginTop: 40 }}>{footer}</div>
      </div>
    ),
    {
      width: POSTER_W,
      height,
      fonts: [...sans, ...penFonts] as OgFont[],
      headers: {
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`${board.title}.png`)}`,
        "Cache-Control": "private, no-store",
      },
    },
  );
}
