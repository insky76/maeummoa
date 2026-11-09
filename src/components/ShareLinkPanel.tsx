"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CloseIcon, KakaoIcon } from "@/components/icons";

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: { sendScrap: (opts: { requestUrl: string }) => void };
    };
  }
}

const KAKAO_SDK = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";

/** 링크 복사 · 카카오톡 공유 · QR 코드 */
export function ShareLinkPanel({
  label,
  url,
  displayUrl,
  qrSvg,
  shareTitle,
}: {
  label: string;
  url: string;
  displayUrl: string;
  qrSvg: string;
  shareTitle: string;
}) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  function initKakao() {
    if (!kakaoKey || !window.Kakao) return;
    if (!window.Kakao.isInitialized()) window.Kakao.init(kakaoKey);
    setKakaoReady(true);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("아래 링크를 복사해 주세요", url);
    }
  }

  async function shareKakao() {
    // 카카오톡 공유는 링크 페이지의 미리보기(OG) 정보를 읽어 카드로 만든다.
    if (kakaoReady && window.Kakao) {
      window.Kakao.Share.sendScrap({ requestUrl: url });
      return;
    }
    // 카카오 키가 없거나 SDK 로드 실패 시: 기기 공유 시트 → 복사 순으로 대체
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
        return;
      } catch {
        // 사용자가 공유 시트를 닫은 경우 등
        return;
      }
    }
    copy();
  }

  return (
    <div className="flex flex-col gap-3">
      {kakaoKey && <Script src={KAKAO_SDK} strategy="afterInteractive" onLoad={initKakao} onReady={initKakao} />}

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-bold text-ink-sub">{label}</span>
        <div className="flex items-center gap-2 rounded-2xl bg-[#F4F3F8] py-1.5 pl-4 pr-1.5">
          <span className="flex-1 truncate text-[15px] font-medium">{displayUrl}</span>
          <button
            type="button"
            onClick={copy}
            className="h-11 rounded-[10px] bg-ink px-4 text-sm font-bold text-white"
            aria-live="polite"
          >
            {copied ? "복사됨" : "복사"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={shareKakao}
          className="flex h-[54px] items-center justify-center gap-2 rounded-2xl bg-kakao text-[15px] font-bold text-kakao-ink"
        >
          <KakaoIcon size={18} />
          카카오톡 공유
        </button>
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="flex h-[54px] items-center justify-center gap-2 rounded-2xl border border-line bg-white text-[15px] font-bold"
        >
          QR 코드
        </button>
      </div>

      {qrOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="QR 코드"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="flex w-full max-w-[340px] flex-col items-center gap-4 rounded-3xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-full items-center justify-between">
              <strong className="text-base">{label}</strong>
              <button
                type="button"
                onClick={() => setQrOpen(false)}
                aria-label="닫기"
                className="flex h-11 w-11 items-center justify-center"
              >
                <CloseIcon size={20} />
              </button>
            </div>
            {/* 서버에서 qrcode 라이브러리로 만든 SVG. 사용자 입력이 아니라 우리 URL 로만 생성된다. */}
            <div className="w-56" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <p className="text-center text-[13px] text-ink-sub">휴대폰 카메라로 비추면 바로 열려요</p>
          </div>
        </div>
      )}
    </div>
  );
}
