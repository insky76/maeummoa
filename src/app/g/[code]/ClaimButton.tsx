"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ClaimButton({ action }: { action: () => Promise<{ ok: true } | { ok: false; error: string }> }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="mt-2 flex w-full flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await action();
            if (r.ok) router.refresh();
            else setError(r.error);
          })
        }
        className="flex h-[54px] w-full items-center justify-center rounded-2xl bg-brand text-base font-bold text-white disabled:opacity-60"
      >
        {pending ? "받는 중…" : "이 계정으로 선물 받기"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
