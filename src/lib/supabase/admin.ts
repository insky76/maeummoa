import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * service role 클라이언트. RLS 를 우회하므로 서버 API 안에서만,
 * 그리고 요청자 권한(비밀번호·소유자)을 직접 확인한 뒤에만 사용한다.
 * 참여자 메시지 작성, 선물 페이지 조회처럼 로그인 없는 공개 경로가 여기를 거친다.
 * 개설자의 쓰기(보드 생성·수정, 메시지 관리, 마감·전달)도 모두 여기를 거친다.
 * 이때는 getUser() 로 확인한 user.id 가 boards.owner_id 와 같은지 먼저 확인한다.
 */
export function createAdminClient() {
  return createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
