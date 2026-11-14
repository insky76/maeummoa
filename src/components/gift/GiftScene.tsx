"use client";

import { useMemo } from "react";
import { FlowerShape, NoteShape, StarShape } from "@/components/shapes";
import { LIMITS, type ThemeKey } from "@/lib/domain";
import { flowerLayout, SCENE_W, seededRandom, starLayout, type Placed } from "@/lib/scene-layout";
import type { PublicMessage } from "@/lib/types";
import { resolveVariant } from "@/lib/variants";

/**
 * 테마별 결과 장면. 메시지 하나 = 누를 수 있는 꽃·별·쪽지 하나.
 * 배경은 SVG, 누르는 부분은 % 로 배치한 <button> 이라 화면 폭이 달라도 비율이 유지된다.
 */
export function GiftScene({
  theme,
  messages,
  seed,
  onOpen,
}: {
  theme: ThemeKey;
  messages: PublicMessage[];
  seed: string;
  onOpen: (index: number) => void;
}) {
  if (theme === "flower") return <FlowerScene messages={messages} seed={seed} onOpen={onOpen} />;
  if (theme === "star") return <StarScene messages={messages} seed={seed} onOpen={onOpen} />;
  return <NoteScene theme={theme} messages={messages} onOpen={onOpen} />;
}

/** 하나씩 피어나는 연출. 개수와 상관없이 전체가 0.8초 안에 끝나게 한다 */
function stagger(i: number, n: number) {
  return `${Math.round(i * Math.min(40, 800 / Math.max(n, 1)))}ms`;
}

type SceneProps = { messages: PublicMessage[]; seed: string; onOpen: (i: number) => void };

function pos(p: Placed, height: number): React.CSSProperties {
  return {
    left: `${((p.x - p.size / 2) / SCENE_W) * 100}%`,
    top: `${((p.y - p.size / 2) / height) * 100}%`,
    width: `${(p.size / SCENE_W) * 100}%`,
  };
}

function FlowerScene({ messages, seed, onOpen }: SceneProps) {
  const layout = useMemo(() => flowerLayout(messages.length, seed, LIMITS.sceneExpandAt), [messages.length, seed]);
  const { height, items, expanded } = layout;
  // 배치는 y 순으로 정렬되어 있으므로, 메시지는 순서대로 자리에 앉힌다
  return (
    <div className="relative w-full" style={{ aspectRatio: `${SCENE_W} / ${height}` }}>
      <svg viewBox={`0 0 ${SCENE_W} ${height}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        {expanded ? (
          <>
            {items.map((p, i) => (
              <g key={i}>
                <line x1={p.x} y1={p.y} x2={p.x + 2} y2={p.y + 40} stroke="#5E9B5A" strokeWidth={2.5} />
                <path d={`M${p.x + 1} ${p.y + 28} c-8 -6 -14 -4 -15 0 c6 3 11 3 15 0Z`} fill="#6FAE69" />
              </g>
            ))}
            <path d={`M0 ${height - 30} C100 ${height - 50} 260 ${height - 20} 390 ${height - 44} L390 ${height} L0 ${height}Z`} fill="#BFE0B5" />
          </>
        ) : (
          <>
            <ellipse cx={195} cy={452} rx={70} ry={9} fill="#F2C9D2" />
            {items.map((p, i) => (
              <line key={i} x1={p.x} y1={p.y} x2={195} y2={420} stroke="#5E9B5A" strokeWidth={3} />
            ))}
            <path d="M150 300 C130 290 120 300 118 312 C132 314 142 310 150 300Z" fill="#6FAE69" />
            <path d="M240 300 C260 290 270 300 272 312 C258 314 248 310 240 300Z" fill="#6FAE69" />
            <polygon points="104,262 286,262 224,446 166,446" fill="#F3D2C1" />
            <polygon points="104,262 195,262 180,446 166,446" fill="#EBC1AD" />
            <path d="M195 340 C170 312 146 322 158 340 C164 350 182 348 195 340Z" fill="#C2375A" />
            <path d="M195 340 C220 312 244 322 232 340 C226 350 208 348 195 340Z" fill="#C2375A" />
            <path d="M190 344 L176 384 M200 344 L214 384" stroke="#C2375A" strokeWidth={5} strokeLinecap="round" />
            <circle cx={195} cy={340} r={7} fill="#9E2846" />
          </>
        )}
      </svg>
      {items.map((p, i) => {
        const m = messages[i];
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onOpen(i)}
            aria-label={`${m.nickname}님의 꽃`}
            className="mm-pop absolute aspect-square rounded-full p-0 transition-transform hover:scale-110 focus-visible:scale-110"
            style={{ ...pos(p, height), animationDelay: stagger(i, messages.length) }}
          >
            <svg viewBox="-24 -24 48 48" className="h-full w-full" aria-hidden="true">
              <FlowerShape v={resolveVariant("flower", m.style, i)} />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

function StarScene({ messages, seed, onOpen }: SceneProps) {
  const layout = useMemo(
    () => starLayout(messages.map((m) => m.body.length), seed, LIMITS.sceneExpandAt),
    // 메시지 길이가 바뀌면 크기가 달라진다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages.map((m) => m.id + m.body.length).join(), seed],
  );
  const { height, items, expanded, links } = layout;
  const dust = useMemo(() => {
    const r = seededRandom(`${seed}:dust`);
    return Array.from({ length: Math.round(height / 12) }, () => ({ x: r() * SCENE_W, y: r() * height, r: 0.6 + r() * 0.9, o: 0.25 + r() * 0.35 }));
  }, [seed, height]);

  return (
    <div className="relative w-full" style={{ aspectRatio: `${SCENE_W} / ${height}` }}>
      <svg viewBox={`0 0 ${SCENE_W} ${height}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="mm-milky" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3A4475" stopOpacity="0" />
            <stop offset="0.5" stopColor="#5A63A0" stopOpacity="0.45" />
            <stop offset="1" stopColor="#3A4475" stopOpacity="0" />
          </linearGradient>
        </defs>
        {expanded && (
          <path
            d={`M${SCENE_W * 0.85 + 140} -20 L${SCENE_W * 0.15 + 140} ${height + 20} L${SCENE_W * 0.15 - 140} ${height + 20} L${SCENE_W * 0.85 - 140} -20Z`}
            fill="url(#mm-milky)"
          />
        )}
        {dust.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#FFFFFF" opacity={d.o} />
        ))}
        {links?.map(([a, b], i) => (
          <line key={i} x1={items[a].x} y1={items[a].y} x2={items[b].x} y2={items[b].y} stroke="#FFF3C4" strokeOpacity={0.28} />
        ))}
        {!expanded && <path d="M0 470 C80 430 140 450 200 440 C270 428 330 446 390 430 L390 470Z" fill="#0C1024" />}
      </svg>
      {items.map((p, i) => {
        const m = messages[i];
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onOpen(i)}
            aria-label={`${m.nickname}님의 별`}
            className="mm-pop absolute aspect-square rounded-full p-0 hover:drop-shadow-[0_0_6px_#FFE08A] focus-visible:drop-shadow-[0_0_6px_#FFE08A]"
            style={{ ...pos(p, height), animationDelay: stagger(i, messages.length) }}
          >
            <svg viewBox="-24 -24 48 48" className="mm-twinkle h-full w-full" style={{ animationDelay: `${(i * 0.37) % 3}s` }} aria-hidden="true">
              <StarShape v={resolveVariant("star", m.style, i)} />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

const NOTE_ROT = [-3, 2.5, 1.5, -2, -1, 3, 2, -2.5];

function NoteScene({ theme, messages, onOpen }: { theme: ThemeKey; messages: PublicMessage[]; onOpen: (i: number) => void }) {
  const dense = messages.length >= LIMITS.sceneExpandAt;
  return (
    <div className={`grid gap-x-3.5 gap-y-[18px] px-[18px] py-6 ${dense ? "grid-cols-3" : "grid-cols-2"}`}>
      {messages.map((m, i) => {
        const v = resolveVariant(theme, m.style, i);
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onOpen(i)}
            aria-label={`${m.nickname}님의 쪽지`}
            className="mm-pop relative flex flex-col justify-between gap-2.5 p-3.5 pt-[18px] text-left shadow-[0_4px_8px_rgba(60,40,10,0.22)]"
            style={{
              background: v.color,
              transform: `rotate(${NOTE_ROT[i % NOTE_ROT.length]}deg)`,
              minHeight: dense ? 104 : 132,
              animationDelay: stagger(i, messages.length),
            }}
          >
            <span
              className="absolute -top-[7px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full shadow-[0_2px_2px_rgba(0,0,0,0.25)]"
              style={{ background: v.accent }}
              aria-hidden="true"
            />
            <p className={`font-hand leading-tight text-[#2B2620] ${dense ? "line-clamp-4 text-lg" : "line-clamp-6 text-[22px]"}`}>
              {m.body}
            </p>
            <span className={`self-end font-hand text-[#4A4034] ${dense ? "text-base" : "text-xl"}`}>- {m.nickname}</span>
          </button>
        );
      })}
    </div>
  );
}

/** 모달·목록에서 쓰는 메시지 아이콘 */
export function SceneIcon({ theme, style, index, size = 34 }: { theme: ThemeKey; style: unknown; index: number; size?: number }) {
  const v = resolveVariant(theme, style, index);
  return (
    <svg width={size} height={size} viewBox="-24 -24 48 48" aria-hidden="true" className="shrink-0">
      {theme === "flower" ? <FlowerShape v={v} /> : theme === "star" ? <StarShape v={v} /> : <NoteShape v={v} />}
    </svg>
  );
}
