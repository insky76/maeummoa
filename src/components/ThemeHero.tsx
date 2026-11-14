import type { ThemeKey } from "@/lib/domain";
import { VARIANTS } from "@/lib/variants";
import { FlowerShape, NoteShape, StarShape } from "@/components/shapes";

/** 참여 페이지 머리말 그림. 테마의 첫인상을 크게 보여 준다. */
export function ThemeHeroArt({ theme, width = 170 }: { theme: ThemeKey; width?: number }) {
  const h = (width * 150) / 170;
  if (theme === "flower") {
    const f = VARIANTS.flower;
    const pts: [number, number, number][] = [
      [50, 56, 0],
      [120, 56, 3],
      [85, 36, 1],
      [66, 84, 2],
      [104, 84, 4],
    ];
    return (
      <svg width={width} height={h} viewBox="0 0 170 150" aria-hidden="true">
        {pts.map(([x, y], i) => (
          <line key={i} x1={x} y1={y} x2={85} y2={140} stroke="#5E9B5A" strokeWidth={2.5} />
        ))}
        {pts.map(([x, y, vi], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <FlowerShape v={f[vi]} />
          </g>
        ))}
        <polygon points="56,104 114,104 96,148 74,148" fill="#F3D2C1" />
        <path d="M76 116 L85 124 L94 116" stroke="#C2375A" strokeWidth={3} fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (theme === "star") {
    const s = VARIANTS.star;
    const pts: [number, number, number, number][] = [
      [30, 40, 0, 0.8],
      [78, 24, 1, 1.1],
      [128, 52, 2, 0.9],
      [96, 96, 3, 1],
      [44, 112, 1, 0.7],
    ];
    return (
      <svg width={width} height={h} viewBox="0 0 170 150" aria-hidden="true">
        <g stroke="#FFF3C4" strokeOpacity={0.35}>
          <line x1={30} y1={40} x2={78} y2={24} />
          <line x1={78} y1={24} x2={128} y2={52} />
          <line x1={128} y1={52} x2={96} y2={96} />
          <line x1={96} y1={96} x2={44} y2={112} />
        </g>
        {pts.map(([x, y, vi, sc], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${sc})`}>
            <StarShape v={s[vi]} />
          </g>
        ))}
      </svg>
    );
  }
  const n = VARIANTS.note;
  const pts: [number, number, number, number][] = [
    [48, 44, 0, -6],
    [118, 46, 1, 5],
    [52, 108, 2, 4],
    [120, 108, 3, -4],
  ];
  return (
    <svg width={width} height={h} viewBox="0 0 170 150" aria-hidden="true">
      {pts.map(([x, y, vi, rot], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(1.45)`}>
          <NoteShape v={n[vi]} />
        </g>
      ))}
    </svg>
  );
}
