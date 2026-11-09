import Link from "next/link";
import { Wordmark } from "@/components/Logo";
import { PlusIcon } from "@/components/icons";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "내 보드" };

// M2 에서 만든 보드·받은 보드 목록을 채운다. 지금은 로그인 확인과 로그아웃만 있다.
export default async function MyBoardsPage() {
  if (!env.isSupabaseConfigured()) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] items-center justify-center px-6 text-center text-sm text-ink-sub">
        Supabase 키가 아직 연결되지 않았어요. README 의 설정 순서를 따라 .env.local 을 채워 주세요.
      </main>
    );
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle()
    : { data: null };

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-[480px] flex-col bg-surface">
      <header className="flex h-14 items-center justify-between bg-white px-5">
        <Link href="/">
          <Wordmark />
        </Link>
        <form action="/auth/signout" method="post">
          <button type="submit" className="px-1 py-3 text-sm font-medium text-ink-sub">
            로그아웃
          </button>
        </form>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-lg font-bold">{profile?.nickname ?? "회원"}님, 반가워요</p>
        <p className="text-sm text-ink-sub">아직 만든 보드가 없어요.</p>
      </main>

      <Link
        href="/new"
        className="absolute bottom-7 right-5 flex h-14 items-center gap-2 rounded-full bg-brand px-5 text-[15px] font-bold text-white shadow-lg shadow-brand/30"
      >
        <PlusIcon />새 보드
      </Link>
    </div>
  );
}
