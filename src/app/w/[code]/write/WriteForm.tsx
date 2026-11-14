"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackIcon } from "@/components/icons";
import { MessageGlyph } from "@/components/MessageGlyph";
import { PasswordInput } from "@/components/PasswordInput";
import { COVER_STYLE } from "@/components/ThemeCover";
import { LIMITS, type ThemeKey } from "@/lib/domain";
import { rememberMyMessage } from "@/lib/my-messages";
import type { StyleVariant } from "@/lib/theme-styles";

export function WriteForm({
  code,
  theme,
  recipient,
  heading,
  submitLabel,
  variants,
}: {
  code: string;
  theme: ThemeKey;
  recipient: string;
  heading: string;
  submitLabel: string;
  variants: StyleVariant[];
}) {
  const router = useRouter();
  const [variant, setVariant] = useState(variants[0].key);
  const [nickname, setNickname] = useState("");
  const [body, setBody] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const current = variants.find((v) => v.key === variant) ?? variants[0];
  const cover = COVER_STYLE[theme];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return setError("이름을 입력해 주세요.");
    if (!body.trim()) return setError("메시지를 입력해 주세요.");
    if (!/^\d{4}$/.test(password)) return setError("비밀번호는 숫자 4자리로 정해 주세요.");

    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/w/${code}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nickname, body, variant, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
        setPending(false);
        return;
      }
      rememberMyMessage(code, { id: data.id, nickname: nickname.trim(), at: new Date().toISOString() });
      const q = new URLSearchParams({ m: data.id, n: String(data.ordinal) });
      if (data.pending) q.set("p", "1");
      router.replace(`/w/${code}/done?${q.toString()}`);
    } catch {
      setError("네트워크가 불안정해요. 잠시 후 다시 시도해 주세요.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center gap-1 px-2">
        <Link href={`/w/${code}`} aria-label="뒤로" className="flex h-11 w-11 items-center justify-center">
          <BackIcon />
        </Link>
        <h1 className="text-base font-bold">{heading}</h1>
      </header>

      <main className="flex flex-1 flex-col gap-[22px] px-5 pb-6 pt-2">
        <fieldset
          className="flex flex-col items-center gap-3.5 rounded-[20px] px-3 pb-4 pt-5"
          style={{ background: cover.bg }}
        >
          <legend className="sr-only">꾸미기</legend>
          <MessageGlyph theme={theme} variant={current} size={88} />
          <div role="radiogroup" aria-label="모양 고르기" className="flex flex-wrap justify-center gap-2.5">
            {variants.map((v) => (
              <button
                key={v.key}
                type="button"
                role="radio"
                aria-checked={v.key === variant}
                aria-label={v.label}
                onClick={() => setVariant(v.key)}
                className={`flex h-11 w-11 items-center justify-center rounded-full bg-white ${
                  v.key === variant ? "ring-2 ring-ink" : "ring-1 ring-black/10"
                }`}
              >
                <MessageGlyph theme={theme} variant={v} size={26} />
              </button>
            ))}
          </div>
          <span className="text-[13px] font-medium" style={{ color: cover.sub }}>
            {current.label}
          </span>
        </fieldset>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold">이름</span>
          <input
            value={nickname}
            maxLength={LIMITS.nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={`${recipient}님이 알아볼 수 있는 이름`}
            className="h-[52px] rounded-xl border border-line px-4 text-base outline-none focus-visible:outline-2 focus-visible:outline-brand"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="flex justify-between text-sm font-bold">
            메시지
            <span className="font-normal text-ink-muted">
              {body.length} / {LIMITS.body}
            </span>
          </span>
          <textarea
            rows={5}
            maxLength={LIMITS.body}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`${recipient}님에게 전하고 싶은 말을 적어 주세요`}
            className="resize-none rounded-xl border border-line px-4 py-3.5 text-[15px] leading-relaxed outline-none focus-visible:outline-2 focus-visible:outline-brand"
          />
        </label>

        <div className="flex flex-col gap-2">
          <label htmlFor="pw" className="text-sm font-bold">
            비밀번호 4자리
          </label>
          <PasswordInput id="pw" value={password} onChange={setPassword} />
          <span className="text-xs text-ink-muted">나중에 이 메시지를 수정하거나 삭제할 때 필요해요.</span>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
      </main>

      <div className="sticky bottom-0 border-t border-line-soft bg-white px-5 pb-6 pt-3">
        <button
          type="submit"
          disabled={pending}
          className="h-[54px] w-full rounded-2xl bg-brand text-base font-bold text-white disabled:opacity-60"
        >
          {pending ? "남기는 중…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
