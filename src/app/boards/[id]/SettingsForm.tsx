"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sheet } from "@/components/Sheet";
import { ToggleRow } from "@/components/Toggle";
import { deleteBoard, updateSettings } from "./actions";

type Opts = { optPreviewMessages: boolean; optRequireApproval: boolean; optSurprise: boolean; optPublicResult: boolean };

/** M-02 설정 탭: 운영 옵션 변경, 보드 삭제 */
export function SettingsForm({
  boardId,
  title,
  recipientName,
  initial,
  delivered,
}: {
  boardId: string;
  title: string;
  recipientName: string;
  initial: Opts;
  delivered: boolean;
}) {
  const router = useRouter();
  const [opts, setOpts] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [askDelete, setAskDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(opts) !== JSON.stringify(initial);

  const set = (k: keyof Opts) => (v: boolean) => {
    setOpts((p) => ({ ...p, [k]: v }));
    setMsg(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-line-soft bg-white px-4">
        {!delivered && (
          <>
            <ToggleRow
              label="다른 사람 메시지 미리 보기"
              description="참여자가 다른 메시지를 볼 수 있어요"
              checked={opts.optPreviewMessages}
              onChange={set("optPreviewMessages")}
            />
            <ToggleRow
              label="승인 후 게시"
              description="내가 확인한 메시지만 보드에 보여요"
              checked={opts.optRequireApproval}
              onChange={set("optRequireApproval")}
            />
            <ToggleRow
              label="서프라이즈 모드"
              description={
                opts.optSurprise
                  ? `전달하기 전에는 ${recipientName}님이 보드를 열 수 없어요`
                  : `${recipientName}님이 모이는 과정을 실시간으로 볼 수 있어요 (선물 링크가 바로 만들어져요)`
              }
              checked={opts.optSurprise}
              onChange={set("optSurprise")}
            />
          </>
        )}
        <ToggleRow
          label="결과 페이지 공개"
          description={
            opts.optPublicResult
              ? "선물 링크가 있으면 누구나 볼 수 있어요"
              : "처음 받은 한 사람(로그인)만 볼 수 있어요"
          }
          checked={opts.optPublicResult}
          onChange={set("optPublicResult")}
        />
      </div>

      {initial.optSurprise === false && opts.optSurprise && (
        <p className="rounded-xl bg-warn-soft px-4 py-3 text-[13px] leading-relaxed text-warn">
          이미 보낸 선물 링크가 있다면, 서프라이즈를 켠 뒤에는 전달할 때까지 열리지 않아요.
        </p>
      )}

      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-ok" : "text-danger"}`}>
          {msg.text}
        </p>
      )}

      <button
        type="button"
        disabled={!dirty || pending}
        onClick={() =>
          start(async () => {
            const r = await updateSettings(boardId, opts);
            setMsg(r.ok ? { ok: true, text: "저장했어요" } : { ok: false, text: r.error });
            if (r.ok) router.refresh();
          })
        }
        className="h-12 rounded-xl bg-ink text-[15px] font-bold text-white disabled:opacity-40"
      >
        {pending ? "저장 중…" : "설정 저장"}
      </button>

      <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-danger/30 bg-white p-4">
        <strong className="text-[15px]">보드 삭제</strong>
        <p className="text-[13px] leading-relaxed text-ink-sub">보드와 모든 메시지가 지워지고, 참여·선물 링크도 열리지 않아요.</p>
        <button type="button" onClick={() => setAskDelete(true)} className="mt-1 h-11 self-start rounded-xl px-1 text-sm font-bold text-danger">
          이 보드 삭제하기
        </button>
      </div>

      {askDelete && (
        <Sheet title="보드를 삭제할까요?" onClose={() => setAskDelete(false)}>
          <p className="text-sm leading-relaxed text-ink-sub">
            되돌릴 수 없어요. 확인을 위해 보드 제목 <strong className="text-ink">{title}</strong> 을(를) 입력해 주세요.
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            aria-label="보드 제목 입력"
            className="h-12 rounded-xl border border-line px-4 text-base outline-none focus-visible:outline-2 focus-visible:outline-brand"
          />
          <button
            type="button"
            disabled={confirmText.trim() !== title.trim() || pending}
            onClick={() =>
              start(async () => {
                const r = await deleteBoard(boardId);
                if (r && !r.ok) setMsg({ ok: false, text: r.error });
              })
            }
            className="h-12 rounded-xl bg-danger text-[15px] font-bold text-white disabled:opacity-40"
          >
            {pending ? "삭제 중…" : "삭제"}
          </button>
        </Sheet>
      )}
    </div>
  );
}
