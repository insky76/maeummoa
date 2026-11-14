"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BackIcon } from "@/components/icons";
import { PasswordInput } from "@/components/PasswordInput";
import { LIMITS } from "@/lib/domain";
import { loadMyMessages, rememberMyMessage, type MyMessageRef } from "@/lib/my-messages";

type Found = { id: string; nickname: string; body: string };

export function MineClient({ code, title }: { code: string; title: string }) {
  const [local, setLocal] = useState<MyMessageRef[] | null>(null);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [found, setFound] = useState<Found[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => setLocal(loadMyMessages(code)), [code]);

  async function find(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return setError("이름을 입력해 주세요.");
    if (!/^\d{4}$/.test(password)) return setError("비밀번호는 숫자 4자리예요.");
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/w/${code}/find`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nickname, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "찾지 못했어요.");
        setFound([]);
      } else {
        const list = data.messages as Found[];
        setFound(list);
        list.forEach((m) => rememberMyMessage(code, { id: m.id, nickname: m.nickname, at: new Date().toISOString() }));
      }
    } catch {
      setError("네트워크가 불안정해요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPending(false);
      setPassword("");
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center gap-1 px-2">
        <Link href={`/w/${code}`} aria-label="뒤로" className="flex h-11 w-11 items-center justify-center">
          <BackIcon />
        </Link>
        <h1 className="text-base font-bold">내 메시지 수정·삭제</h1>
      </header>

      <main className="flex flex-1 flex-col gap-7 px-5 pb-8 pt-2">
        <p className="text-sm text-ink-sub">{title}</p>

        <section className="flex flex-col gap-2.5">
          <h2 className="text-[15px] font-bold">이 기기에서 쓴 메시지</h2>
          {local === null ? null : local.length ? (
            <ul className="flex flex-col gap-2">
              {local.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/w/${code}/done?m=${m.id}`}
                    className="flex items-center justify-between rounded-2xl border border-line-soft px-4 py-3.5"
                  >
                    <span className="text-[15px] font-medium">{m.nickname}</span>
                    <span className="text-[13px] text-ink-muted">열기</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">이 기기에 기억된 메시지가 없어요.</p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-bold">다른 기기에서 썼나요?</h2>
          <p className="text-[13px] text-ink-sub">작성할 때 쓴 이름과 비밀번호로 찾을 수 있어요.</p>
          <form onSubmit={find} className="flex flex-col gap-2.5">
            <input
              value={nickname}
              maxLength={LIMITS.nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="이름"
              aria-label="이름"
              className="h-[52px] rounded-xl border border-line px-4 text-base outline-none focus-visible:outline-2 focus-visible:outline-brand"
            />
            <PasswordInput value={password} onChange={setPassword} />
            {error && (
              <p role="alert" className="text-[13px] text-danger">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="h-12 rounded-2xl bg-ink text-[15px] font-bold text-white disabled:opacity-60"
            >
              {pending ? "찾는 중…" : "내 메시지 찾기"}
            </button>
          </form>
          {found.length > 0 && (
            <ul className="flex flex-col gap-2">
              {found.map((m) => (
                <li key={m.id}>
                  <Link href={`/w/${code}/done?m=${m.id}`} className="flex flex-col gap-1 rounded-2xl border border-line-soft p-4">
                    <strong className="text-sm">{m.nickname}</strong>
                    <span className="line-clamp-2 text-sm text-ink-sub">{m.body}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
