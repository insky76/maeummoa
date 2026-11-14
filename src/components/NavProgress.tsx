"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * 화면을 옮길 때 맨 위에 진행 막대를 보여 준다.
 * 같은 사이트 링크를 누르면 시작하고, 주소가 바뀌면(새 화면이 그려지면) 끝낸다.
 */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    setState((s) => (s === "loading" ? "done" : s));
    const t = setTimeout(() => setState((s) => (s === "done" ? "idle" : s)), 350);
    return () => clearTimeout(t);
  }, [pathname, search]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setState("loading");
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (state === "idle") return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]" role="progressbar" aria-label="불러오는 중">
      <div
        className="h-full bg-brand shadow-[0_0_8px_var(--color-brand)]"
        style={{
          width: state === "done" ? "100%" : "85%",
          opacity: state === "done" ? 0 : 1,
          transition: state === "done" ? "width 150ms ease-out, opacity 300ms 150ms" : "width 6s cubic-bezier(0.1, 0.7, 0.3, 1)",
          animation: state === "loading" ? "mm-progress-start 6s cubic-bezier(0.1, 0.7, 0.3, 1)" : undefined,
        }}
      />
    </div>
  );
}
