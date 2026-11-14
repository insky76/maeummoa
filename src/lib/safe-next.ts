/**
 * 로그인 후 이동할 경로 검증. 외부 주소로 튀는 오픈 리다이렉트를 막기 위해
 * 같은 사이트 안의 경로만 허용한다.
 * - "//evil.com", "/\\evil.com" 거부
 * - 제어문자(탭·개행 등) 거부: 브라우저는 URL 의 탭·개행을 지우므로 "/\t/evil.com" 이 "//evil.com" 이 된다
 * - 마지막으로 URL 로 해석해 origin 이 바뀌지 않는지 확인
 */
const BASE = "http://internal.invalid";

export function safeNextPath(next: string | null | undefined, fallback = "/new"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(next)) return fallback;
  try {
    const url = new URL(next, BASE);
    if (url.origin !== BASE) return fallback;
    // 정규화한 값을 돌려주면 "/..//evil.com" 이 "//evil.com" 이 되므로, 검증을 통과한 원래 값을 그대로 쓴다
    return next;
  } catch {
    return fallback;
  }
}
