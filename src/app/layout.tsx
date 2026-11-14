import type { Metadata, Viewport } from "next";
import { Gowun_Dodum, Nanum_Pen_Script, Noto_Sans_KR } from "next/font/google";
import { env } from "@/lib/env";
import "./globals.css";

const noto = Noto_Sans_KR({
  variable: "--font-noto",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const gowun = Gowun_Dodum({
  variable: "--font-gowun",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const pen = Nanum_Pen_Script({
  variable: "--font-pen",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl()),
  title: {
    default: "마음모아 · 한 사람을 위한 응원 보드",
    template: "%s · 마음모아",
  },
  description: "링크 하나로 친구들의 응원 메시지를 모아 꽃다발·밤하늘·쪽지 벽으로 선물해요.",
  openGraph: {
    siteName: "마음모아",
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 아이폰 홈 바 영역까지 쓰고, 아래 버튼은 safe-area 만큼 띄운다
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={`${noto.variable} ${gowun.variable} ${pen.variable} antialiased`}>{children}</body>
    </html>
  );
}
