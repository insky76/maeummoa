"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MessageArt } from "@/components/shapes";
import { LIMITS, type ThemeKey } from "@/lib/domain";
import { checkMessagePassword, deleteMessage, editMessage } from "./actions";

type Msg = { id: string; nickname: string; body: string; style: Record<string, unknown>; status: string };
type Mode = null | "edit" | "delete";

/** 참여자 본인 메시지: 비밀번호 4자리로 수정·삭제 */
export function MyMessageCard({
  code,
  theme,
  message,
  canEdit,
}: {
  code: string;
  theme: ThemeKey;
  message: Msg;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [asking, setAsking] = useState<Mode>(null);
  const [pw, setPw] = useState("");
  const [verifiedPw, setVerifiedPw] = useState<string | null>(null);
  const [draft, setDraft] = useState(message.body);
  const [error, setError] = useState("");
  const [deleted, setDeleted] = useState(false);
  const [pending, start] = useTransition();

  function confirm() {
    if (!/^\d{4}$/.test(pw)) return setError("숫자 4자리를 입력해 주세요.");
    setError("");
    start(async () => {
      if (asking === "edit") {
        const r = await checkMessagePassword(code, message.id, pw);
        if (!r.ok) return setError(r.error);
        setDraft(r.data.body);
        setVerifiedPw(pw);
        setAsking(null);
        setPw("");
      } else {
        const r = await deleteMessage(code, message.id, pw);
        if (!r.ok) return setError(r.error);
        setAsking(null);
        setDeleted(true);
        router.refresh();
      }
    });
  }

  function save() {
    if (!verifiedPw) return;
    if (!draft.trim()) return setError("메시지를 입력해 주세요.");
    setError("");
    start(async () => {
      const r = await editMessage(code, message.id, verifiedPw, draft);
      if (!r.ok) return setError(r.error);
      setVerifiedPw(null);
      router.refresh();
    });
  }

  if (deleted) {
    return (
      <p className="rounded-2xl bg-surface px-4 py-4 text-sm text-ink-sub" role="status">
        메시지를 지웠어요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line-soft p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <MessageArt theme={theme} style={message.style} size={22} />
          <strong className="truncate text-sm">내가 쓴 메시지 · {message.nickname}</strong>
          {message.status === "pending" && (
            <span className="shrink-0 rounded-full bg-warn-soft px-2 py-0.5 text-[11px] font-bold text-warn">확인 중</span>
          )}
          {message.status === "hidden" && (
            <span className="shrink-0 rounded-full bg-line-soft px-2 py-0.5 text-[11px] font-bold text-ink-sub">숨김</span>
          )}
        </span>
        {canEdit && !verifiedPw && (
          <span className="flex shrink-0 gap-1">
            <button type="button" onClick={() => { setAsking("edit"); setError(""); }} className="h-9 rounded-lg px-2.5 text-[13px] font-bold text-ink-sub">
              수정
            </button>
            <button type="button" onClick={() => { setAsking("delete"); setError(""); }} className="h-9 rounded-lg px-2.5 text-[13px] font-bold text-danger">
              삭제
            </button>
          </span>
        )}
      </div>

      {verifiedPw ? (
        <div className="flex flex-col gap-2.5">
          <textarea
            rows={4}
            value={draft}
            maxLength={LIMITS.body}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="메시지 고치기"
            className="resize-none rounded-xl border border-line px-4 py-3 text-[15px] leading-relaxed outline-none focus-visible:outline-2 focus-visible:outline-brand"
          />
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { setVerifiedPw(null); setDraft(message.body); setError(""); }} className="h-12 rounded-xl border border-line text-[15px] font-bold">
              취소
            </button>
            <button type="button" disabled={pending} onClick={save} className="h-12 rounded-xl bg-brand text-[15px] font-bold text-white disabled:opacity-60">
              {pending ? "저장 중…" : "수정 완료"}
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-line text-[15px] leading-relaxed">{message.body}</p>
      )}

      {asking && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={asking === "delete" ? "메시지 삭제" : "메시지 수정"}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center"
          onClick={() => setAsking(null)}
        >
          <form
            onSubmit={(e) => { e.preventDefault(); confirm(); }}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-[480px] flex-col gap-3.5 rounded-t-3xl bg-white p-6 sm:rounded-3xl"
          >
            <strong className="text-lg">{asking === "delete" ? "메시지를 지울까요?" : "메시지를 고칠까요?"}</strong>
            <p className="text-sm text-ink-sub">남길 때 정한 숫자 4자리를 입력해 주세요.</p>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-bold">비밀번호</span>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                maxLength={4}
                autoFocus
                value={pw}
                onChange={(e) => setPw(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="h-[52px] rounded-xl border border-line px-4 text-base tracking-[6px] placeholder:tracking-normal outline-none focus-visible:outline-2 focus-visible:outline-brand"
              />
            </label>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setAsking(null)} className="h-12 rounded-xl border border-line text-[15px] font-bold">
                취소
              </button>
              <button
                type="submit"
                disabled={pending}
                className={`h-12 rounded-xl text-[15px] font-bold text-white disabled:opacity-60 ${asking === "delete" ? "bg-danger" : "bg-brand"}`}
              >
                {pending ? "확인 중…" : asking === "delete" ? "지우기" : "확인"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
