import "server-only";
import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { hmac } from "@/lib/server/secret";

/**
 * 참여자 기기 식별. 로그인 없이 "같은 기기 연속 작성 제한", "신고는 기기당 한 번"을 지키기 위해
 * httpOnly 쿠키에 임의 id 를 두고, DB 에는 HMAC 해시만 저장한다 (원문 저장 금지).
 */
const DEVICE_COOKIE = "mm_did";
const ONE_YEAR = 60 * 60 * 24 * 365;

/** 서버 액션·라우트 핸들러 전용 (쿠키를 쓸 수 있는 곳). 없으면 새로 발급한다. */
export async function ensureDeviceId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(DEVICE_COOKIE)?.value;
  if (existing && /^[0-9a-f-]{36}$/.test(existing)) return existing;
  const id = randomUUID();
  store.set(DEVICE_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return id;
}

export function deviceHash(deviceId: string): string {
  return hmac("device", deviceId);
}

/** 요청 IP 의 해시. Vercel 은 x-forwarded-for 첫 값이 실제 클라이언트다. */
export async function requestIpHash(): Promise<string | null> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim();
  return ip ? hmac("ip", ip) : null;
}
