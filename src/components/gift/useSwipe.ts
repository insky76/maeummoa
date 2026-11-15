"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "drag" | "out" | "in";

const OUT_MS = 160;
const IN_MS = 220;

/**
 * 카드 좌우 넘기기 (밀기·화살표·키보드 공통).
 * - 미는 동안 손가락을 따라 움직이고(끝으로 갈수록 살짝 저항), 놓으면
 * - 충분히 밀었으면: 민 방향으로 미끄러져 나가고 → 내용이 바뀌고 → 반대쪽에서 들어온다
 * - 덜 밀었으면: 제자리로 부드럽게 돌아온다
 * 위아래 스크롤은 그대로 두기 위해 style 에 touchAction: "pan-y" 를 쓴다.
 */
export function useSwipe(onPrev: () => void, onNext: () => void, enabled = true, threshold = 56) {
  const start = useRef<{ x: number; y: number; id: number; t: number } | null>(null);
  const width = useRef(320);
  const [dx, setDx] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [enterFrom, setEnterFrom] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  /** dir: -1 이전, +1 다음 */
  const go = useCallback(
    (dir: -1 | 1) => {
      // 나가는 중에만 막고, 들어오는 중이면 바로 다음 넘기기를 받는다 (연속으로 빠르게 넘길 때)
      if (!enabled || phase === "out") return;
      setPhase("out");
      setDx(-dir * (width.current + 40));
      timers.current.push(
        window.setTimeout(() => {
          if (dir > 0) onNext();
          else onPrev();
          // 반대쪽 가까이에서 시작해 제자리로
          setEnterFrom(dir * 70);
          setDx(0);
          setPhase("in");
          timers.current.push(window.setTimeout(() => setPhase("idle"), IN_MS + 20));
        }, OUT_MS),
      );
    },
    [enabled, phase, onNext, onPrev],
  );

  const handlers = {
    onPointerDown(e: React.PointerEvent<HTMLElement>) {
      if (!enabled || phase === "out" || phase === "drag") return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (phase === "in") setPhase("idle");
      width.current = e.currentTarget.offsetWidth || width.current;
      start.current = { x: e.clientX, y: e.clientY, id: e.pointerId, t: performance.now() };
    },
    onPointerMove(e: React.PointerEvent<HTMLElement>) {
      const s = start.current;
      if (!s || s.id !== e.pointerId) return;
      const mx = e.clientX - s.x;
      const my = e.clientY - s.y;
      if (phase !== "drag") {
        if (Math.abs(my) > Math.abs(mx) && Math.abs(my) > 8) {
          start.current = null; // 세로 스크롤
          return;
        }
        if (Math.abs(mx) < 8) return;
        setPhase("drag");
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }
      // 화면 폭의 절반을 넘으면 저항이 생기게
      const half = width.current / 2;
      const eased = Math.abs(mx) <= half ? mx : Math.sign(mx) * (half + (Math.abs(mx) - half) * 0.35);
      setDx(eased);
    },
    onPointerUp(e: React.PointerEvent<HTMLElement>) {
      const s = start.current;
      start.current = null;
      if (!s || phase !== "drag") return;
      const mx = e.clientX - s.x;
      const speed = Math.abs(mx) / Math.max(1, performance.now() - s.t); // px/ms
      // 멀리 밀었거나, 짧아도 빠르게 튕기면 넘긴다
      if (Math.abs(mx) >= threshold || (Math.abs(mx) > 24 && speed > 0.5)) {
        setPhase("idle");
        go(mx < 0 ? 1 : -1);
      } else {
        setPhase("idle");
        setDx(0);
      }
    },
    onPointerCancel() {
      start.current = null;
      setPhase("idle");
      setDx(0);
    },
  };

  const style: React.CSSProperties = { touchAction: "pan-y", willChange: "transform" };
  if (phase === "drag") {
    style.transform = `translateX(${dx}px)`;
    style.opacity = 1 - Math.min(Math.abs(dx) / (width.current * 1.6), 0.35);
    style.transition = "none";
  } else if (phase === "out") {
    style.transform = `translateX(${dx}px)`;
    style.opacity = 0;
    style.transition = `transform ${OUT_MS}ms cubic-bezier(0.4, 0, 1, 1), opacity ${OUT_MS}ms linear`;
  } else if (phase === "in") {
    style.animation = `mm-card-in ${IN_MS}ms cubic-bezier(0, 0, 0.2, 1) both`;
    (style as Record<string, string>)["--mm-enter-from"] = `${enterFrom}px`;
  } else {
    style.transform = "translateX(0)";
    style.transition = "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms";
  }

  return { handlers, style, go };
}
