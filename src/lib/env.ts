/**
 * 환경 변수 접근. 값이 없으면 어떤 키가 빠졌는지 바로 알 수 있게 에러를 던진다.
 * NEXT_PUBLIC_* 는 번들 시점에 치환되므로 process.env.X 형태로 직접 참조해야 한다.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`환경 변수 ${name} 가 설정되지 않았습니다. .env.local 을 확인하세요 (README 참고).`);
  }
  return value;
}

export const env = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  /** 서버 전용. 절대 클라이언트 코드에서 import 하지 말 것. */
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
  siteUrl: () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  isSupabaseConfigured: () =>
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
};
