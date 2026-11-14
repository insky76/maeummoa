import { Logo } from "@/components/Logo";

/** 화면을 불러오는 동안 보여 주는 자리 (loading.tsx 공용) */
export function PageLoading({ label = "불러오는 중이에요" }: { label?: string }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-4 bg-white" role="status" aria-live="polite">
      <span className="mm-breathe">
        <Logo size={48} />
      </span>
      <span className="text-sm text-ink-sub">{label}</span>
    </div>
  );
}
