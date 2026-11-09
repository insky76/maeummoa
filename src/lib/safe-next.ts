/**
 * 로그인 후 이동할 경로 검증. 외부 주소로 튀는 오픈 리다이렉트를 막기 위해
 * "/" 로 시작하는 내부 경로만 허용한다 ("//evil.com" 같은 형태도 거부).
 */
export function safeNextPath(next: string | null | undefined, fallback = "/new"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
