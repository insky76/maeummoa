"use client";

import { useState, useTransition } from "react";
import { reportMessage } from "@/app/actions/report";

/** 신고 버튼. 누르면 한 번 더 묻고, 보낸 뒤에는 "신고됨"으로 바뀐다. */
export function ReportButton({
  messageId,
  compact = false,
  className = "",
  color,
}: {
  messageId: string;
  compact?: boolean;
  className?: string;
  color?: string;
}) {
  const [state, setState] = useState<"idle" | "confirm" | "done" | "error">("idle");
  const [pending, start] = useTransition();

  if (state === "done") {
    return (
      <span className={`text-xs ${className}`} style={{ color }} role="status">
        신고했어요
      </span>
    );
  }
  if (state === "confirm") {
    return (
      <span className={`flex items-center gap-1 text-xs ${className}`} style={{ color }}>
        신고할까요?
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await reportMessage(messageId);
              setState(r.ok ? "done" : "error");
            })
          }
          className="h-8 rounded-lg px-2 font-bold underline underline-offset-2"
        >
          {pending ? "보내는 중" : "신고"}
        </button>
        <button type="button" onClick={() => setState("idle")} className="h-8 rounded-lg px-2">
          취소
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setState("confirm")}
      className={`shrink-0 text-xs ${compact ? "h-8 px-1" : "h-11 px-3"} ${className}`}
      style={{ color: color ?? "var(--color-ink-muted)" }}
      aria-label="이 메시지 신고"
    >
      {state === "error" ? "다시 신고" : "신고"}
    </button>
  );
}
