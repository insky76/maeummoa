"use client";

import { useState } from "react";
import { MessageArt } from "@/components/shapes";
import { ReportButton } from "@/components/ReportButton";
import type { ThemeKey } from "@/lib/domain";
import type { PublicMessage } from "@/lib/types";

const INITIAL = 3;

/** 참여 페이지의 "먼저 남긴 메시지" 목록. 개설자가 미리 보기를 켠 경우에만 보인다. */
export function MessagePreviewList({
  theme,
  title,
  messages,
}: {
  theme: ThemeKey;
  title: string;
  messages: PublicMessage[];
}) {
  const [open, setOpen] = useState(false);
  const shown = open ? messages : messages.slice(0, INITIAL);
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">{title}</h2>
        <span className="text-xs text-ink-muted">개설자가 공개했어요</span>
      </div>
      <ul className="flex flex-col gap-2">
        {shown.map((m, i) => (
          <li key={m.id} className="flex gap-3 rounded-2xl border border-line-soft p-3.5">
            <MessageArt theme={theme} style={m.style} index={i} size={22} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <strong className="truncate text-[13px]">{m.nickname}</strong>
                <ReportButton messageId={m.id} compact />
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[#2E2B3A]">{m.body}</p>
            </div>
          </li>
        ))}
      </ul>
      {messages.length > INITIAL && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="h-11 text-sm font-medium text-ink-sub"
          aria-expanded={open}
        >
          {open ? "접기" : `${messages.length - INITIAL}개 더 보기`}
        </button>
      )}
    </div>
  );
}
