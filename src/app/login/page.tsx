import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { BackIcon } from "@/components/icons";
import { LoginButtons } from "./LoginButtons";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-next";

export const metadata = { title: "로그인" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNextPath(rawNext);

  // 이미 로그인했다면 이 화면은 건너뛴다.
  if (env.isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect(next);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white">
      <header className="flex h-14 items-center px-2">
        <Link href="/" aria-label="뒤로" className="flex h-11 w-11 items-center justify-center">
          <BackIcon />
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-5 px-8 pb-10 text-center">
        <Logo size={72} />
        <h1 className="font-display text-[26px] font-bold leading-snug">
          로그인하고
          <br />
          보드를 만들어 볼까요?
        </h1>
        <p className="text-sm leading-relaxed text-ink-sub">
          만든 보드와 받은 선물을
          <br />내 보드에서 언제든 다시 볼 수 있어요.
        </p>
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            로그인에 실패했어요. 다시 시도해 주세요.
          </p>
        )}
      </main>

      <div className="flex flex-col gap-2.5 px-5 pb-7">
        <LoginButtons next={next} configured={env.isSupabaseConfigured()} />
        <p className="mt-2 text-center text-xs leading-relaxed text-ink-muted">
          시작하면 이용약관과 개인정보 처리방침에 동의하게 돼요.
        </p>
      </div>
    </div>
  );
}
