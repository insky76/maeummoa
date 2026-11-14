"use client";

import { useState } from "react";
import { PasswordInput } from "@/components/PasswordInput";

/**
 * 비밀번호 확인 시트. onConfirm 이 오류 문구를 돌려주면 시트에 보여 주고,
 * null 을 돌려주면 성공으로 보고 닫힌다 (닫는 건 부모가 결정).
 */
export function PasswordSheet({
  title,
  confirmLabel = "확인",
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: (password: string) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(pw)) return setError("숫자 4자리를 입력해 주세요.");
    setPending(true);
    setError(null);
    const err = await onConfirm(pw);
    setPending(false);
    if (err) {
      setError(err);
      setPw("");
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pw-sheet-title"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-[rgba(20,18,30,0.5)]"
      onClick={onCancel}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="mx-auto flex w-full max-w-[480px] flex-col gap-3.5 rounded-t-[20px] bg-white px-5 pb-7 pt-6"
      >
        <strong id="pw-sheet-title" className="text-lg">
          {title}
        </strong>
        <p className="text-sm text-ink-sub">작성할 때 정한 숫자 4자리를 입력해 주세요.</p>
        <PasswordInput value={pw} onChange={setPw} autoFocus />
        {error && (
          <p role="alert" className="text-[13px] text-[#B3261E]">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onCancel} className="h-[52px] rounded-2xl border border-line bg-white text-[15px]">
            취소
          </button>
          <button
            type="submit"
            disabled={pending}
            className={`h-[52px] rounded-2xl text-[15px] font-bold text-white disabled:opacity-60 ${
              danger ? "bg-danger" : "bg-brand"
            }`}
          >
            {pending ? "확인 중…" : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
