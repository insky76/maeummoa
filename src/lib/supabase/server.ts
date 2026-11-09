import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/** 서버 컴포넌트·라우트 핸들러용. 로그인한 사용자 권한(RLS 적용)으로 동작한다. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // 서버 컴포넌트에서 호출된 경우 쿠키를 쓸 수 없다. 세션 갱신은 middleware 가 담당한다.
        }
      },
    },
  });
}
