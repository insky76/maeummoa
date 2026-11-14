"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sheet } from "@/components/Sheet";
import { MessageArt } from "@/components/shapes";
import { LIMITS, type ThemeKey } from "@/lib/domain";
import type { OwnerMessage } from "@/lib/types";
import { ownerApproveAll, ownerDeleteMessage, ownerEditMessage, ownerSetMessageStatus, type ManageResult } from "./actions";

type Filter = "all" | "pending" | "reported" | "hidden";

/** M-03 메시지 관리: 승인·수정("개설자가 수정함")·숨김·삭제 */
export function MessageManager({
  boardId,
  theme,
  messages,
  seenAt,
}: {
  boardId: string;
  theme: ThemeKey;
  messages: OwnerMessage[];
  seenAt: string | null;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<OwnerMessage | null>(null);
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<OwnerMessage | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();

  const counts = {
    pending: messages.filter((m) => m.status === "pending").length,
    reported: messages.filter((m) => m.report_count > 0).length,
    hidden: messages.filter((m) => m.status === "hidden").length,
  };
  const shown = messages.filter((m) =>
    filter === "all" ? true : filter === "pending" ? m.status === "pending" : filter === "reported" ? m.report_count > 0 : m.status === "hidden",
  );

  function run(key: string, fn: () => Promise<ManageResult>, after?: () => void) {
    setError("");
    setBusy(key);
    start(async () => {
      const r = await fn();
      setBusy(null);
      if (!r.ok) return setError(r.error);
      after?.();
      router.refresh();
    });
  }

  const chips: [Filter, string, number?][] = [
    ["all", `전체 ${messages.length}`],
    ["pending", "확인 대기", counts.pending],
    ["reported", "신고됨", counts.reported],
    ["hidden", "숨김", counts.hidden],
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="메시지 거르기">
        {chips
          .filter(([k, , n]) => k === "all" || (n ?? 0) > 0)
          .map(([k, label, n]) => (
            <button
              key={k}
              type="button"
              aria-pressed={filter === k}
              onClick={() => setFilter(k)}
              className={`h-9 rounded-full px-3.5 text-[13px] ${
                filter === k ? "bg-ink font-bold text-white" : "border border-line bg-white font-medium"
              }`}
            >
              {label}
              {n ? ` ${n}` : ""}
            </button>
          ))}
      </div>

      {counts.pending > 0 && filter !== "hidden" && filter !== "reported" && (
        <button
          type="button"
          onClick={() => run("approve-all", () => ownerApproveAll(boardId))}
          disabled={busy !== null}
          className="h-11 rounded-xl bg-ok-soft text-sm font-bold text-ok disabled:opacity-60"
        >
          확인 대기 {counts.pending}개 모두 올리기
        </button>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <p className="py-14 text-center text-sm text-ink-sub">
          {messages.length === 0 ? "아직 메시지가 없어요. 참여 링크를 공유해 보세요." : "해당하는 메시지가 없어요."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {shown.map((m, i) => {
            const isNew = !seenAt || Date.parse(m.created_at) > Date.parse(seenAt);
            return (
              <li
                key={m.id}
                className={`flex flex-col gap-2.5 rounded-2xl border bg-white p-4 ${
                  m.report_count > 0 ? "border-danger/40" : "border-line-soft"
                } ${m.status === "hidden" ? "opacity-70" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <MessageArt theme={theme} style={m.style} index={i} size={20} />
                  <strong className="mr-1 text-sm">{m.nickname}</strong>
                  {isNew && <Badge cls="bg-brand-soft text-brand-strong">새 메시지</Badge>}
                  {m.status === "pending" && <Badge cls="bg-warn-soft text-warn">확인 대기</Badge>}
                  {m.status === "hidden" && <Badge cls="bg-line-soft text-ink-sub">숨김</Badge>}
                  {m.report_count > 0 && <Badge cls="bg-danger-soft text-danger">신고 {m.report_count}건</Badge>}
                  {m.edited_by_owner && <Badge cls="bg-surface text-ink-sub">개설자가 수정함</Badge>}
                </div>
                <p className="whitespace-pre-line text-[15px] leading-relaxed">{m.body}</p>
                <div className="flex flex-wrap justify-end gap-1">
                  {m.status === "pending" && (
                    <ActionBtn onClick={() => run(m.id, () => ownerSetMessageStatus(boardId, m.id, "visible"))} disabled={busy !== null} strong>
                      올리기
                    </ActionBtn>
                  )}
                  <ActionBtn
                    onClick={() => {
                      setEditing(m);
                      setDraft(m.body);
                      setError("");
                    }}
                    disabled={busy !== null}
                  >
                    수정
                  </ActionBtn>
                  {m.status !== "pending" && (
                    <ActionBtn
                      onClick={() => run(m.id, () => ownerSetMessageStatus(boardId, m.id, m.status === "hidden" ? "visible" : "hidden"))}
                      disabled={busy !== null}
                    >
                      {m.status === "hidden" ? "다시 보이기" : "숨기기"}
                    </ActionBtn>
                  )}
                  <ActionBtn onClick={() => setConfirmDelete(m)} disabled={busy !== null} danger>
                    삭제
                  </ActionBtn>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <Sheet title={`${editing.nickname}님의 메시지 수정`} onClose={() => setEditing(null)}>
          <textarea
            rows={5}
            value={draft}
            maxLength={LIMITS.body}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="메시지 내용"
            className="resize-none rounded-xl border border-line px-4 py-3 text-[15px] leading-relaxed outline-none focus-visible:outline-2 focus-visible:outline-brand"
          />
          <p className="text-[13px] text-ink-sub">수정한 메시지에는 ‘개설자가 수정함’ 표시가 붙어요.</p>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setEditing(null)} className="h-12 rounded-xl border border-line text-[15px] font-bold">
              취소
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => run("edit", () => ownerEditMessage(boardId, editing.id, draft), () => setEditing(null))}
              className="h-12 rounded-xl bg-brand text-[15px] font-bold text-white disabled:opacity-60"
            >
              {busy === "edit" ? "저장 중…" : "저장"}
            </button>
          </div>
        </Sheet>
      )}

      {confirmDelete && (
        <Sheet title="메시지를 삭제할까요?" onClose={() => setConfirmDelete(null)}>
          <p className="rounded-xl bg-surface p-4 text-sm leading-relaxed">
            <strong>{confirmDelete.nickname}</strong> · {confirmDelete.body}
          </p>
          <p className="text-[13px] text-ink-sub">삭제하면 되돌릴 수 없어요. 잠시 가리고 싶다면 ‘숨기기’를 써 주세요.</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setConfirmDelete(null)} className="h-12 rounded-xl border border-line text-[15px] font-bold">
              취소
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => run("delete", () => ownerDeleteMessage(boardId, confirmDelete.id), () => setConfirmDelete(null))}
              className="h-12 rounded-xl bg-danger text-[15px] font-bold text-white disabled:opacity-60"
            >
              {busy === "delete" ? "삭제 중…" : "삭제"}
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function Badge({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}>{children}</span>;
}

function ActionBtn({
  onClick,
  disabled,
  danger,
  strong,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  strong?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-9 rounded-lg px-3 text-[13px] font-bold disabled:opacity-50 ${
        danger ? "text-danger" : strong ? "bg-ok-soft text-ok" : "text-ink-sub"
      }`}
    >
      {children}
    </button>
  );
}
