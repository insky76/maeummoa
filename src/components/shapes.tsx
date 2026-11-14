import type { ThemeKey } from "@/lib/domain";
import { resolveVariant, type Variant } from "@/lib/variants";

/**
 * 메시지 하나를 나타내는 모양. SVG <g> 로 그려서 장면(꽃다발·밤하늘)과 작은 아이콘에 같이 쓴다.
 * 모두 (0,0) 을 가운데로, 반지름 약 22 크기로 그린다. viewBox="-24 -24 48 48" 기준.
 */
export function FlowerShape({ v, outline = false }: { v: Variant; outline?: boolean }) {
  const r = 9;
  const petals = [0, 72, 144, 216, 288].map((deg) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [Math.cos(rad) * r, Math.sin(rad) * r] as const;
  });
  // 흰 데이지는 밝은 바탕에서도 보이도록 테두리를 넣는다
  const stroke = outline || v.color.toUpperCase() === "#FFFFFF" ? "#E7C9D1" : "#FFFFFF";
  return (
    <g>
      {petals.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={v.color} stroke={stroke} strokeWidth={0.8} />
      ))}
      <circle cx={0} cy={0} r={5} fill={v.accent} />
    </g>
  );
}

export function StarShape({ v }: { v: Variant }) {
  return (
    <g>
      <path d="M0,-20 L4.6,-4.6 L20,0 L4.6,4.6 L0,20 L-4.6,4.6 L-20,0 L-4.6,-4.6Z" fill={v.color} />
      <circle cx={0} cy={0} r={3.6} fill={v.accent} />
    </g>
  );
}

export function NoteShape({ v }: { v: Variant }) {
  return (
    <g>
      <rect x={-17} y={-17} width={34} height={34} rx={2} fill={v.color} transform="rotate(-4)" />
      <circle cx={0} cy={-16} r={3.4} fill={v.accent} />
      <path d="M-9 -4 H9 M-9 3 H6 M-9 10 H3" stroke="#00000033" strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
}

export function ShapeFor({ theme, v }: { theme: ThemeKey; v: Variant }) {
  if (theme === "flower") return <FlowerShape v={v} />;
  if (theme === "star") return <StarShape v={v} />;
  return <NoteShape v={v} />;
}

/** 독립된 작은 그림 (목록 아이콘, 작성 화면 미리보기) */
export function MessageArt({
  theme,
  style,
  variant,
  index = 0,
  size = 40,
}: {
  theme: ThemeKey;
  style?: unknown;
  variant?: Variant;
  index?: number;
  size?: number;
}) {
  const v = variant ?? resolveVariant(theme, style, index);
  return (
    <svg width={size} height={size} viewBox="-24 -24 48 48" aria-hidden="true" className="shrink-0">
      <ShapeFor theme={theme} v={v} />
    </svg>
  );
}
