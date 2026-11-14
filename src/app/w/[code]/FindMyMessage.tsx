"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { findMyMessage } from "./actions";

/** 다른 기기에서 남긴 메시지를 이름 + 비밀번호로 찾아 이 기기에 기억시킨다 */
export function FindMyMessage({ code }: { code: string }) {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-col gap-3 rounded-2xl bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        start(async () => {
          const r = await findMyMessage(code, nickname, pw);
          if (!r.ok) return setError(r.error);
          setNickname("");
          setPw("");
          router.refresh();
        });
      }}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-[15px] font-bold">다른 기기에서 남겼나요?</h2>
        <p className="text-[13px] text-ink-sub">남길 때 쓴 이름과 비밀번호로 찾을 수 있어요.</p>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold">이름</span>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          className="h-12 rounded-xl border border-line bg-white px-4 text-base outline-none focus-visible:outline-2 focus-visible:outline-brand"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold">비밀번호 4자리</span>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pw}
          onChange={(e) => setPw(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="h-12 rounded-xl border border-line bg-white px-4 text-base tracking-[6px] outline-none focus-visible:outline-2 focus-visible:outline-brand"
        />
      </label>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button type="submit" disabled={pending} className="h-12 rounded-xl bg-ink text-[15px] font-bold text-white disabled:opacity-60">
        {pending ? "찾는 중…" : "찾기"}
      </button>
    </form>
  );
}
