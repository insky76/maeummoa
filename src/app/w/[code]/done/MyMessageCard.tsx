"use client";

import { useState } from "react";
import { MessageGlyph } from "@/components/MessageGlyph";
import { PasswordSheet } from "@/components/PasswordSheet";
import { LIMITS, type ThemeKey } from "@/lib/domain";
import { forgetMyMessage } from "@/lib/my-messages";
import { resolveVariant } from "@/lib/theme-styles";

type Mode = "view" | "ask-edit" | "ask-delete" | "editing" | "deleted";

export function MyMessageCard({
  code,
  theme,
  message,
  canModify,
}: {
  code: string;
  theme: ThemeKey;
  message: { id: string; nickname: string; body: string; style: unknown; pending: boolean };
  canModify: boolean;
}) {
  const [mode, setMode] = useState<Mode>("view");
  const [body, setBody] = useState(message.body);
  const [draft, setDraft] = useState(message.body);
  const [password, setPassword] = useState(""); // 확인된 비밀번호 (수정 저장 때 다시 보낸다)
  const [pending, setPending] = useState(message.pending);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const variant = resolveVariant(theme, message.style);

  async function call(path: string, method: string, payload: object): Promise<{ ok: boolean; data: Record<string, unknown> }> {
    try {
      const res = await fetch(path, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return { ok: res.ok, data: await res.json().catch(() => ({})) };
    } catch {
      return { ok: false, data: { error: "네트워크가 불안정해요. 잠시 후 다시 시도해 주세요." } };
    }
  }

  async function verify(pw: string) {
    const { ok, data } = await call(`/api/messages/${message.id}/verify`, "POST", { password: pw });
    if (!ok) return (data.error as string) ?? "확인하지 못했어요.";
    setPassword(pw);
    setDraft(body);
    setMode("editing");
    return null;
  }

  async function remove(pw: string) {
    const { ok, data } = await call(`/api/messages/${message.id}`, "DELETE", { password: pw });
    if (!ok) return (data.error as string) ?? "삭제하지 못했어요.";
    forgetMyMessage(code, message.id);
    setMode("deleted");
    return null;
  }

  async function save() {
    if (!draft.trim()) return setError("메시지를 입력해 주세요.");
    setSaving(true);
    setError(null);
    const { ok, data } = await call(`/api/messages/${message.id}`, "PATCH", { password, body: draft });
    setSaving(false);
    if (!ok) return setError((data.error as string) ?? "수정하지 못했어요.");
    const saved = data.message as { body: string; status: string };
    setBody(saved.body);
    setPending(saved.status === "pending");
    setPassword("");
    setMode("view");
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-line-soft p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <MessageGlyph theme={theme} variant={variant} size={20} />
          <strong className="text-sm">내가 쓴 메시지 · {message.nickname}</strong>
        </span>
        {canModify && mode === "view" && (
          <span className="flex gap-1">
            <button type="button" onClick={() => setMode("ask-edit")} className="h-9 rounded-lg bg-[#F4F3F8] px-3 text-[13px]">
              수정
            </button>
            <button
              type="button"
              onClick={() => setMode("ask-delete")}
              className="h-9 rounded-lg bg-danger-soft px-3 text-[13px] text-danger"
            >
              삭제
            </button>
          </span>
        )}
      </div>

      {mode === "deleted" ? (
        <p className="text-sm text-ink-muted">메시지를 삭제했어요.</p>
      ) : mode === "editing" ? (
        <div className="flex flex-col gap-2">
          <textarea
            rows={4}
            maxLength={LIMITS.body}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="메시지 수정"
            className="resize-none rounded-xl border border-line px-3.5 py-3 text-[15px] leading-relaxed outline-none focus-visible:outline-2 focus-visible:outline-brand"
          />
          {error && (
            <p role="alert" className="text-[13px] text-danger">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setMode("view")} className="h-11 rounded-[10px] border border-line text-sm">
              취소
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="h-11 rounded-[10px] bg-ink text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? "저장 중…" : "수정 완료"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#2E2B3A]">{body}</p>
          {pending && <p className="text-xs text-ink-muted">개설자가 확인한 뒤에 보드에 보여요.</p>}
        </>
      )}

      {!canModify && mode === "view" && <p className="text-xs text-ink-muted">마감된 보드라 수정·삭제할 수 없어요.</p>}

      {mode === "ask-edit" && (
        <PasswordSheet title="메시지를 수정할까요?" onConfirm={verify} onCancel={() => setMode("view")} />
      )}
      {mode === "ask-delete" && (
        <PasswordSheet
          title="메시지를 삭제할까요?"
          confirmLabel="삭제"
          danger
          onConfirm={remove}
          onCancel={() => setMode("view")}
        />
      )}
    </div>
  );
}
