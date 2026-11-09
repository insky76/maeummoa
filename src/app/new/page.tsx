import Link from "next/link";
import { BackIcon } from "@/components/icons";

export const metadata = { title: "보드 만들기" };

// M2 에서 4단계 보드 만들기(누구에게 → 테마 → 내용 → 설정)를 구현한다.
export default function NewBoardPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white">
      <header className="flex h-14 items-center gap-1 px-2">
        <Link href="/" aria-label="뒤로" className="flex h-11 w-11 items-center justify-center">
          <BackIcon />
        </Link>
        <span className="text-base font-bold">보드 만들기</span>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 text-center text-sm text-ink-sub">
        보드 만들기 화면은 다음 단계(M2)에서 구현해요.
      </main>
    </div>
  );
}
