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

/**
 * 서비스 주소 정규화. 비어 있거나 "https://" 가 빠져 있어도 동작하게 한다.
 * 비어 있으면 Vercel 이 넣어 주는 배포 주소(VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL)를 쓴다.
 */
export function normalizeSiteUrl(...candidates: (string | undefined)[]): string {
  for (const raw of candidates) {
    const v = raw?.trim();
    if (!v) continue;
    const withScheme = /^https?:\/\//i.test(v) ? v : `${v.startsWith("localhost") ? "http" : "https"}://${v}`;
    try {
      return new URL(withScheme).origin;
    } catch {
      // 다음 후보로
    }
  }
  return "http://localhost:3000";
}

export const env = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  /** 서버 전용. 절대 클라이언트 코드에서 import 하지 말 것. */
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
  siteUrl: () =>
    normalizeSiteUrl(
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
      process.env.VERCEL_URL,
    ),
  isSupabaseConfigured: () =>
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
};
