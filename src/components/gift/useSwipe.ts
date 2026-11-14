"use client";

import { useRef, useState } from "react";

/**
 * 좌우로 밀어서 넘기기. 손가락(포인터)을 따라 카드가 움직이고, 일정 거리 이상 밀면 이전·다음으로 넘어간다.
 * 위아래 스크롤은 그대로 두기 위해 style 에 touchAction: "pan-y" 를 함께 쓴다.
 */
export function useSwipe(onPrev: () => void, onNext: () => void, threshold = 60) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const handlers = {
    onPointerDown(e: React.PointerEvent) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    },
    onPointerMove(e: React.PointerEvent) {
      const s = start.current;
      if (!s || s.id !== e.pointerId) return;
      const mx = e.clientX - s.x;
      const my = e.clientY - s.y;
      if (!dragging) {
        // 세로로 더 움직이면 스크롤로 보고 놓아 준다
        if (Math.abs(my) > Math.abs(mx) && Math.abs(my) > 8) {
          start.current = null;
          return;
        }
        if (Math.abs(mx) < 8) return;
        setDragging(true);
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }
      setDx(mx);
    },
    onPointerUp(e: React.PointerEvent) {
      const s = start.current;
      start.current = null;
      if (!s || !dragging) {
        setDragging(false);
        setDx(0);
        return;
      }
      const mx = e.clientX - s.x;
      if (mx <= -threshold) onNext();
      else if (mx >= threshold) onPrev();
      setDragging(false);
      setDx(0);
    },
    onPointerCancel() {
      start.current = null;
      setDragging(false);
      setDx(0);
    },
  };

  const style: React.CSSProperties = {
    touchAction: "pan-y",
    transform: dx ? `translateX(${dx}px) rotate(${dx / 40}deg)` : undefined,
    transition: dragging ? "none" : "transform 200ms ease-out",
  };

  /** 드래그 직후의 클릭(버튼 눌림)을 막을 때 쓴다 */
  return { handlers, style, dragging };
}
