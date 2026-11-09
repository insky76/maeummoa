import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * service role 클라이언트. RLS 를 우회하므로 서버 API 안에서만,
 * 그리고 요청자 권한(비밀번호·소유자)을 직접 확인한 뒤에만 사용한다.
 * 참여자 메시지 작성, 선물 페이지 조회처럼 로그인 없는 공개 경로가 여기를 거친다.
 */
export function createAdminClient() {
  return createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
