import type { ThemeKey } from "@/lib/domain";

/**
 * 테마별 화면 색. 참여 페이지 머리말, 선물 장면, 저장 이미지가 같은 색을 쓴다.
 * 글자색은 바탕 위에서 4.5:1 이상이 되도록 골랐다.
 */
export interface ThemeStyle {
  bg: string;        // 머리말·장면 바탕
  headerBg: string;  // 선물 화면 위·아래 띠
  ink: string;       // 본문 글자
  sub: string;       // 보조 글자
  segBg: string;     // 탭 바탕
  segOn: string;     // 선택된 탭
  btnBg: string;     // 보조 버튼
  btnBorder: string;
  btnInk: string;
  primaryBg: string; // 주 버튼
  primaryInk: string;
  cardBg: string;    // 메시지 카드
  cardInk: string;
  dim: string;       // 모달 뒤 어둡게
  dark: boolean;
}

const FLOWER: ThemeStyle = {
  bg: "#FDF1F3",
  headerBg: "#FDF1F3",
  ink: "#1F1D2B",
  sub: "#6E2A3C",
  segBg: "#F6DCE2",
  segOn: "#FFFFFF",
  btnBg: "#FFFFFF",
  btnBorder: "#EBC3CD",
  btnInk: "#1F1D2B",
  primaryBg: "#C2375A",
  primaryInk: "#FFFFFF",
  cardBg: "#FFFFFF",
  cardInk: "#2E2B3A",
  dim: "rgba(60, 20, 32, 0.45)",
  dark: false,
};

const STAR: ThemeStyle = {
  bg: "#121831",
  headerBg: "#121831",
  ink: "#FFFFFF",
  sub: "#C9CEEA",
  segBg: "#232B4F",
  segOn: "#3A4475",
  btnBg: "#232B4F",
  btnBorder: "#3A4475",
  btnInk: "#FFFFFF",
  primaryBg: "#FFE08A",
  primaryInk: "#121831",
  cardBg: "#1E2647",
  cardInk: "#F1F2FA",
  dim: "rgba(5, 8, 20, 0.6)",
  dark: true,
};

const NOTE: ThemeStyle = {
  bg: "#D2B184",
  headerBg: "#C9A574",
  ink: "#2B1E10",
  sub: "#4E3418",
  segBg: "#B48F5E",
  segOn: "#FFF8EC",
  btnBg: "#FFF8EC",
  btnBorder: "#B48F5E",
  btnInk: "#2B1E10",
  primaryBg: "#2B1E10",
  primaryInk: "#FFF8EC",
  cardBg: "#FFF8EC",
  cardInk: "#2B2620",
  dim: "rgba(43, 30, 16, 0.5)",
  dark: false,
};

export function themeStyle(theme: ThemeKey): ThemeStyle {
  if (theme === "flower") return FLOWER;
  if (theme === "star") return STAR;
  return NOTE;
}
