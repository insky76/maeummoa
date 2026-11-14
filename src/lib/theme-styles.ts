import type { ThemeKey } from "@/lib/domain";

/**
 * 테마별 메시지 꾸밈 선택지. messages.style = { variant: <key> } 로 저장한다.
 * 클라이언트(작성 화면)와 서버(검증) 양쪽에서 같은 목록을 쓴다.
 */
export interface StyleVariant {
  key: string;
  label: string;
  color: string;   // 주 색
  accent: string;  // 꽃 가운데 등 보조 색
}

export const THEME_VARIANTS: Partial<Record<ThemeKey, StyleVariant[]>> = {
  flower: [
    { key: "rose", label: "분홍 장미", color: "#E25C7A", accent: "#F6C94C" },
    { key: "tulip", label: "주황 튤립", color: "#F2A03D", accent: "#7A3B12" },
    { key: "sun", label: "해바라기", color: "#F2C230", accent: "#7A3B12" },
    { key: "hydrangea", label: "수국", color: "#8C8FE6", accent: "#FFFFFF" },
    { key: "lavender", label: "라벤더", color: "#B07CD8", accent: "#FFFFFF" },
    { key: "daisy", label: "데이지", color: "#FFFFFF", accent: "#F6C94C" },
  ],
  star: [
    { key: "cream", label: "크림빛 별", color: "#FFF3C4", accent: "#FFFFFF" },
    { key: "gold", label: "금빛 별", color: "#FFE08A", accent: "#FFFFFF" },
    { key: "peach", label: "복숭앗빛 별", color: "#FFD9A8", accent: "#FFFFFF" },
    { key: "sky", label: "하늘빛 별", color: "#BFD8FF", accent: "#FFFFFF" },
    { key: "pink", label: "분홍빛 별", color: "#FFC4D6", accent: "#FFFFFF" },
  ],
  note: [
    { key: "yellow", label: "노랑 쪽지", color: "#FFE58A", accent: "#C2375A" },
    { key: "pink", label: "분홍 쪽지", color: "#FFC4D0", accent: "#2F6FD0" },
    { key: "mint", label: "민트 쪽지", color: "#BDEBD3", accent: "#2E8B57" },
    { key: "blue", label: "파랑 쪽지", color: "#C6DBFF", accent: "#E0A92E" },
    { key: "lilac", label: "보라 쪽지", color: "#E0CCFF", accent: "#C2375A" },
  ],
};

export function variantsFor(theme: ThemeKey): StyleVariant[] {
  return THEME_VARIANTS[theme] ?? THEME_VARIANTS.note!;
}

/** 저장된 style 에서 변형을 찾는다. 모르는 값이면 첫 번째로 대체 (데이터가 깨져도 화면은 그려지게) */
export function resolveVariant(theme: ThemeKey, style: unknown): StyleVariant {
  const list = variantsFor(theme);
  const key = typeof style === "object" && style !== null ? (style as { variant?: unknown }).variant : undefined;
  return list.find((v) => v.key === key) ?? list[0];
}

export function isValidVariant(theme: ThemeKey, key: string): boolean {
  return variantsFor(theme).some((v) => v.key === key);
}
