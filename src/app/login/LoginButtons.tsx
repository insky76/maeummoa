"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KakaoIcon } from "@/components/icons";

type Provider = "kakao" | "google";

export function LoginButtons({ next, configured }: { next: string; configured: boolean }) {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: Provider) {
    if (!configured) {
      setError("Supabase 키가 아직 연결되지 않았어요. .env.local 을 설정해 주세요.");
      return;
    }
    setPending(provider);
    setError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        // 카카오: 이메일 동의항목은 비즈 앱 전환이 필요해서, 닉네임·프로필 사진만 요청한다.
        ...(provider === "kakao" ? { scopes: "profile_nickname profile_image" } : {}),
      },
    });
    if (error) {
      setError("로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setPending(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => signIn("kakao")}
        disabled={pending !== null}
        className="flex h-[54px] items-center justify-center gap-2 rounded-2xl bg-kakao text-base font-bold text-kakao-ink disabled:opacity-60"
      >
        <KakaoIcon />
        {pending === "kakao" ? "카카오로 이동 중…" : "카카오로 시작하기"}
      </button>
      <button
        type="button"
        onClick={() => signIn("google")}
        disabled={pending !== null}
        className="flex h-[54px] items-center justify-center rounded-2xl border border-line bg-white text-base font-medium disabled:opacity-60"
      >
        {pending === "google" ? "Google로 이동 중…" : "Google로 시작하기"}
      </button>
      {error && (
        <p role="alert" className="text-center text-sm text-danger">
          {error}
        </p>
      )}
    </>
  );
}
