import Link from "next/link";
import { BoardsIcon, HomeIcon } from "@/components/icons";

/** 개설자 화면 오른쪽 위: 홈 · 내 보드로 바로 가기 */
export function OwnerNav({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="바로 가기" className={`flex items-center ${className}`}>
      <Link href="/" aria-label="홈" title="홈" className="flex h-11 w-11 items-center justify-center text-ink-sub">
        <HomeIcon />
      </Link>
      <Link href="/me" aria-label="내 보드" title="내 보드" className="flex h-11 w-11 items-center justify-center text-ink-sub">
        <BoardsIcon />
      </Link>
    </nav>
  );
}
