"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";

/** 화면을 그리다 예상하지 못한 오류가 났을 때 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-4 bg-white px-8 text-center">
      <Logo size={56} />
      <h1 className="font-display text-2xl font-bold">잠시 문제가 생겼어요</h1>
      <p className="text-sm leading-relaxed text-ink-sub">
        일시적인 문제일 수 있어요. 잠시 뒤에 다시 시도해 주세요.
        {error.digest && (
          <>
            <br />
            <span className="text-xs text-ink-muted">오류 코드: {error.digest}</span>
          </>
        )}
      </p>
      <div className="mt-2 flex w-full flex-col gap-2">
        <button type="button" onClick={reset} className="h-[52px] rounded-2xl bg-brand text-[15px] font-bold text-white">
          다시 시도
        </button>
        <Link href="/" className="flex h-12 items-center justify-center rounded-2xl text-[15px] font-medium text-ink-sub">
          마음모아 홈으로
        </Link>
      </div>
    </div>
  );
}
