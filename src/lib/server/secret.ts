import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * 서버 비밀값. 기기·IP 해시와 쿠키 서명에 쓴다.
 * MM_SECRET 이 있으면 그것을, 없으면 service role 키에서 파생한다 (키를 바꾸면 기존 해시·쿠키는 무효가 된다).
 */
function secret(): string {
  const s = process.env.MM_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("MM_SECRET 또는 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");
  return createHash("sha256").update(`maeummoa:${s}`).digest("hex");
}

export function hmac(purpose: string, value: string): string {
  return createHmac("sha256", secret()).update(`${purpose}:${value}`).digest("base64url");
}

export function hmacEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
