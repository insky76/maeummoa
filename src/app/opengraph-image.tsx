import { homeOgImage, OG_SIZE } from "@/lib/server/og-images";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "마음모아 · 한 사람을 위한 응원 보드";

/** 서비스 대표 미리보기. 참여·선물 링크는 각자 자기 미리보기를 쓴다. */
export default function Image() {
  return homeOgImage();
}
