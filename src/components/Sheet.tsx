"use client";

import { useEffect, useRef } from "react";
import { CloseIcon } from "@/components/icons";

/** 아래에서 올라오는 시트 (휴대폰), 넓은 화면에서는 가운데 상자. Esc·바깥 누르면 닫힌다. */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center"
      onClick={onClose}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className="mm-fade-in flex max-h-[90dvh] w-full max-w-[480px] flex-col gap-4 overflow-y-auto rounded-t-3xl bg-white p-6 outline-none sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <strong className="text-lg">{title}</strong>
          <button type="button" onClick={onClose} aria-label="닫기" className="-mr-2 flex h-11 w-11 items-center justify-center">
            <CloseIcon size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
