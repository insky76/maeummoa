import type { ThemeKey } from "@/lib/domain";

/**
 * 메시지 하나의 꾸밈(꽃 종류, 별 색, 쪽지 색). messages.style 에 {"variant": key} 로 저장한다.
 * 테마가 같으면 모양은 같고 색만 다르다.
 */
export interface Variant {
  key: string;
  label: string;
  color: string;   // 꽃잎·별·쪽지 바탕
  accent: string;  // 꽃 가운데·별 빛·쪽지 압정
}

export const VARIANTS: Record<"flower" | "star" | "note", Variant[]> = {
  flower: [
    { key: "rose", label: "분홍 장미", color: "#E25C7A", accent: "#F6C94C" },
    { key: "tulip", label: "주황 튤립", color: "#F2A03D", accent: "#7A3B12" },
    { key: "sun", label: "해바라기", color: "#F2C230", accent: "#7A3B12" },
    { key: "hydrangea", label: "수국", color: "#8C8FE6", accent: "#FFFFFF" },
    { key: "lavender", label: "라벤더", color: "#B07CD8", accent: "#FFFFFF" },
    { key: "daisy", label: "데이지", color: "#FFFFFF", accent: "#F6C94C" },
  ],
  star: [
    { key: "cream", label: "달빛 별", color: "#FFF3C4", accent: "#FFFFFF" },
    { key: "gold", label: "금빛 별", color: "#FFE08A", accent: "#FFFFFF" },
    { key: "white", label: "하얀 별", color: "#FFFFFF", accent: "#FFF3C4" },
    { key: "peach", label: "노을 별", color: "#FFD9A8", accent: "#FFFFFF" },
    { key: "sky", label: "푸른 별", color: "#BFD7FF", accent: "#FFFFFF" },
  ],
  note: [
    { key: "yellow", label: "노란 쪽지", color: "#FFE58A", accent: "#C2375A" },
    { key: "pink", label: "분홍 쪽지", color: "#FFC4D0", accent: "#2F6FD0" },
    { key: "mint", label: "민트 쪽지", color: "#BDEBD3", accent: "#C2375A" },
    { key: "blue", label: "하늘 쪽지", color: "#C6DBFF", accent: "#E0A92E" },
    { key: "violet", label: "보라 쪽지", color: "#E0CCFF", accent: "#2E8B57" },
  ],
};

type SceneTheme = keyof typeof VARIANTS;

/** 출시 전 테마(light, letter)는 꾸밈 목록이 없으므로 쪽지 색을 빌린다 */
export function variantsFor(theme: ThemeKey): Variant[] {
  return VARIANTS[(theme in VARIANTS ? theme : "note") as SceneTheme];
}

export function isVariantKey(theme: ThemeKey, key: unknown): key is string {
  return typeof key === "string" && variantsFor(theme).some((v) => v.key === key);
}

/** 저장된 style 에서 꾸밈을 찾는다. 없거나 모르는 값이면 순서(index)로 돌려 가며 고른다. */
export function resolveVariant(theme: ThemeKey, style: unknown, index = 0): Variant {
  const list = variantsFor(theme);
  const key = style && typeof style === "object" ? (style as { variant?: unknown }).variant : undefined;
  return list.find((v) => v.key === key) ?? list[index % list.length];
}
