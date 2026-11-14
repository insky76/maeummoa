import type { ThemeKey } from "@/lib/domain";
import { ThemeTile } from "@/components/ThemeTile";

/** 참여 페이지 상단 배경·글자색. 테마마다 분위기를 맞춘다. */
export const COVER_STYLE: Record<ThemeKey, { bg: string; ink: string; sub: string }> = {
  flower: { bg: "#FCE8EC", ink: "#1F1D2B", sub: "#6E2A3C" },
  star: { bg: "#121831", ink: "#FFFFFF", sub: "#C9CEEA" },
  note: { bg: "#D2B184", ink: "#2B1E10", sub: "#4E3418" },
  light: { bg: "#2A2140", ink: "#FFFFFF", sub: "#D8CEFF" },
  letter: { bg: "#F1E6D6", ink: "#2B1E10", sub: "#5C3D1E" },
};

export function ThemeArt({ theme }: { theme: ThemeKey }) {
  const t = theme === "star" || theme === "note" ? theme : "flower";
  return (
    <div className="w-[150px] [&>div]:bg-transparent">
      <ThemeTile theme={t} />
    </div>
  );
}
