"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { BackIcon } from "@/components/icons";
import { MessageArt } from "@/components/shapes";
import { LIMITS, THEMES, type ThemeKey } from "@/lib/domain";
import { josa } from "@/lib/josa";
import { themeStyle } from "@/lib/theme-style";
import type { Variant } from "@/lib/variants";
import { createMessage } from "../actions";

const inputCls =
  "h-[52px] rounded-xl border px-4 text-base outline-none focus-visible:outline-2 focus-visible:outline-brand";

export function WriteForm({
  code,
  theme,
  recipientName,
  variants,
  requireApproval,
}: {
  code: string;
  theme: ThemeKey;
  recipientName: string;
  variants: Variant[];
  requireApproval: boolean;
}) {
  const copy = THEMES[theme];
  const ts = themeStyle(theme);
  const [variant, setVariant] = useState(variants[0].key);
  const [nickname, setNickname] = useState("");
  const [body, setBody] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ msg: string; field?: string } | null>(null);
  const [pending, start] = useTransition();
  const current = variants.find((v) => v.key === variant) ?? variants[0];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return setError({ msg: "이름을 입력해 주세요.", field: "nickname" });
    if (!body.trim()) return setError({ msg: "메시지를 입력해 주세요.", field: "body" });
    if (!/^\d{4}$/.test(password)) return setError({ msg: "비밀번호는 숫자 4자리로 정해 주세요.", field: "password" });
    setError(null);
    start(async () => {
      const r = await createMessage(code, { nickname, body, password, variant });
      // 성공하면 서버 액션이 완료 화면으로 이동시킨다
      if (r && !r.ok) setError({ msg: r.error, field: r.field });
    });
  }

  const border = (field: string) => (error?.field === field ? "border-danger" : "border-line");

  return (
    <form onSubmit={submit} className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white" noValidate>
      <header className="flex h-14 shrink-0 items-center gap-1 px-2">
        <Link href={`/w/${code}`} aria-label="뒤로" className="flex h-11 w-11 items-center justify-center">
          <BackIcon />
        </Link>
        <span className="text-base font-bold">{copy.writeCta}</span>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-5 pb-6 pt-2 short:gap-4">
        <div
          className="flex flex-col items-center gap-3.5 rounded-[20px] pb-4 pt-5 short:gap-2 short:pb-3 short:pt-3"
          style={{ background: theme === "flower" ? "#FCE8EC" : ts.bg }}
        >
          <div className="w-[88px] short:w-14 [&>svg]:h-auto [&>svg]:w-full">
            <MessageArt theme={theme} variant={current} size={88} />
          </div>
          <div role="radiogroup" aria-label={`${copy.item} 고르기`} className="flex flex-wrap justify-center gap-2.5 px-3">
            {variants.map((v) => (
              <button
                key={v.key}
                type="button"
                role="radio"
                aria-checked={v.key === variant}
                aria-label={v.label}
                onClick={() => setVariant(v.key)}
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{
                  background: ts.dark ? "#1E2647" : "#FFFFFF",
                  border: v.key === variant ? `2px solid ${ts.dark ? "#FFFFFF" : "#1F1D2B"}` : `1px solid ${ts.btnBorder}`,
                }}
              >
                <MessageArt theme={theme} variant={v} size={26} />
              </button>
            ))}
          </div>
          <span className="text-[13px] font-medium" style={{ color: ts.sub }}>
            {current.label}
          </span>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold">이름</span>
          <input
            className={`${inputCls} ${border("nickname")}`}
            value={nickname}
            maxLength={LIMITS.nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={`${josa(recipientName, "이/가")} 알아볼 수 있는 이름`}
            autoComplete="nickname"
            aria-invalid={error?.field === "nickname"}
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
            value={body}
            maxLength={LIMITS.body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`${josa(recipientName, "이에게/에게")} 전하고 싶은 말을 적어 주세요`}
            aria-invalid={error?.field === "body"}
            className={`resize-none rounded-xl border px-4 py-3.5 text-[15px] leading-relaxed outline-none focus-visible:outline-2 focus-visible:outline-brand ${border("body")}`}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold">비밀번호 4자리</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={4}
            value={password}
            onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="숫자 4자리"
            aria-invalid={error?.field === "password"}
            className={`${inputCls} tracking-[6px] ${border("password")}`}
          />
          <span className="text-xs text-ink-muted">나중에 이 메시지를 고치거나 지울 때 필요해요.</span>
        </label>

        {requireApproval && (
          <p className="text-[13px] leading-relaxed text-ink-sub">
            이 보드는 개설자가 확인한 메시지만 올라가요. 남긴 뒤 조금 기다려 주세요.
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {error.msg}
          </p>
        )}
      </main>

      <div className="sticky bottom-0 border-t border-line-soft bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="submit"
          disabled={pending}
          className="h-[54px] w-full rounded-2xl bg-brand text-base font-bold text-white disabled:opacity-60"
        >
          {pending ? "남기는 중…" : copy.submitCta}
        </button>
      </div>
    </form>
  );
}
