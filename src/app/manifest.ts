import type { MetadataRoute } from "next";

/** 휴대폰 "홈 화면에 추가" 때 쓰는 앱 정보 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "마음모아 · 한 사람을 위한 응원 보드",
    short_name: "마음모아",
    description: "링크 하나로 친구들의 응원 메시지를 모아 꽃다발·밤하늘·쪽지 벽으로 선물해요.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "ko",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
