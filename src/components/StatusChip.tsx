import type { BoardStatus } from "@/lib/domain";
import { STATUS_LABEL } from "@/lib/boards";

const STYLE: Record<BoardStatus, string> = {
  collecting: "bg-ok-soft text-ok",
  closed: "bg-warn-soft text-warn",
  delivered: "bg-line-soft text-ink-sub",
};

export function StatusChip({ status, label }: { status: BoardStatus; label?: string }) {
  return (
    <span className={`self-start rounded-full px-2 py-0.5 text-[11px] font-bold ${STYLE[status]}`}>
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}
