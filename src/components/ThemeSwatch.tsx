import type { ThemeKey } from "@/lib/domain";

const SWATCH: Record<ThemeKey, { bg: string; dot: string }> = {
  flower: { bg: "#FCE8EC", dot: "#E25C7A" },
  star: { bg: "#161C38", dot: "#FFF3C4" },
  note: { bg: "#D8B98E", dot: "#FFE58A" },
  light: { bg: "#2A2140", dot: "#B7A6FF" },
  letter: { bg: "#F1E6D6", dot: "#C2375A" },
};

/** 목록·선택지에 쓰는 작은 테마 아이콘 */
export function ThemeSwatch({ theme, size = 52 }: { theme: ThemeKey; size?: number }) {
  const s = SWATCH[theme];
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl"
      style={{ width: size, height: size, background: s.bg }}
      aria-hidden="true"
    >
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 30 30">
        <circle cx="9" cy="11" r="4" fill={s.dot} />
        <circle cx="20" cy="9" r="3" fill={s.dot} />
        <circle cx="15" cy="20" r="5" fill={s.dot} />
      </svg>
    </span>
  );
}
