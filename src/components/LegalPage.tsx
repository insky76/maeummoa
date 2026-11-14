import Link from "next/link";
import { BackIcon } from "@/components/icons";

/** 약관·방침 문서 공용 틀 */
export function LegalPage({ title, effectiveDate, children }: { title: string; effectiveDate: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[720px] flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center gap-1 px-2">
        <Link href="/" aria-label="홈으로" className="flex h-11 w-11 items-center justify-center">
          <BackIcon />
        </Link>
        <span className="text-base font-bold">{title}</span>
      </header>
      <main className="legal flex flex-col gap-6 px-6 pb-16 pt-4 text-[15px] leading-relaxed text-ink">
        <p className="text-sm text-ink-sub">시행일: {effectiveDate}</p>
        {children}
        <nav className="mt-6 flex gap-4 border-t border-line-soft pt-6 text-sm text-ink-sub">
          <Link href="/terms" className="underline underline-offset-4">이용약관</Link>
          <Link href="/privacy" className="underline underline-offset-4">개인정보처리방침</Link>
          <Link href="/" className="underline underline-offset-4">마음모아 홈</Link>
        </nav>
      </main>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-[17px] font-bold">{title}</h2>
      {children}
    </section>
  );
}
