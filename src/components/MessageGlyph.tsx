import type { ThemeKey } from "@/lib/domain";
import type { StyleVariant } from "@/lib/theme-styles";

const STAR = "M0,-11 L2.6,-2.6 L11,0 L2.6,2.6 L0,11 L-2.6,2.6 L-11,0 L-2.6,-2.6Z";

/** 메시지 하나를 나타내는 테마 오브젝트 (꽃 / 별 / 쪽지) */
export function MessageGlyph({
  theme,
  variant,
  size = 30,
  className,
}: {
  theme: ThemeKey;
  variant: StyleVariant;
  size?: number;
  className?: string;
}) {
  if (theme === "star") {
    return (
      <svg width={size} height={size} viewBox="-12 -12 24 24" className={className} aria-hidden="true">
        <path d={STAR} fill={variant.color} stroke="#121831" strokeOpacity="0.25" strokeWidth="0.6" />
        <circle cx="0" cy="0" r="2.2" fill="#FFFFFF" />
      </svg>
    );
  }
  if (theme === "note") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="1.5" fill={variant.color} transform="rotate(-5 12 12)" />
        <circle cx="12" cy="4.5" r="2" fill={variant.accent} />
      </svg>
    );
  }
  // flower (기본)
  return (
    <svg width={size} height={size} viewBox="-22 -22 44 44" className={className} aria-hidden="true">
      {[
        [0, -9],
        [8.6, -2.8],
        [5.3, 7.3],
        [-5.3, 7.3],
        [-8.6, -2.8],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="9" fill={variant.color} stroke="#E9C6CF" strokeWidth="0.8" />
      ))}
      <circle cx="0" cy="0" r="5" fill={variant.accent} />
    </svg>
  );
}
