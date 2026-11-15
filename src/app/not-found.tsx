import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "페이지를 찾을 수 없어요" };

/** 없는 주소, 지워진 보드, 남의 보드 관리 주소 등 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-4 bg-white px-8 text-center">
      <Logo size={56} />
      <h1 className="font-display text-2xl font-bold">페이지를 찾을 수 없어요</h1>
      <p className="text-sm leading-relaxed text-ink-sub">
        주소가 잘못됐거나, 보드가 삭제됐을 수 있어요.
        <br />
        받은 링크를 다시 한번 확인해 주세요.
      </p>
      <div className="mt-2 flex w-full flex-col gap-2">
        <Link href="/" className="flex h-[52px] items-center justify-center rounded-2xl bg-brand text-[15px] font-bold text-white">
          마음모아 홈으로
        </Link>
        <Link href="/me" className="flex h-12 items-center justify-center rounded-2xl text-[15px] font-medium text-ink-sub">
          내 보드
        </Link>
      </div>
    </div>
  );
}
