"use client";

import { useState } from "react";

export function ReportButton({ messageId, className }: { messageId: string; className?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function report() {
    if (!window.confirm("이 메시지를 신고할까요? 개설자가 확인해요.")) return;
    setState("sending");
    try {
      const res = await fetch(`/api/messages/${messageId}/report`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") return <span className={`text-xs text-ink-muted ${className ?? ""}`}>신고했어요</span>;
  return (
    <button
      type="button"
      onClick={report}
      disabled={state === "sending"}
      className={`min-h-9 px-1 text-xs text-ink-muted underline-offset-2 hover:underline ${className ?? ""}`}
    >
      {state === "error" ? "다시 신고" : "신고"}
    </button>
  );
}
