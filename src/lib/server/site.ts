import "server-only";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { normalizeSiteUrl } from "@/lib/env";

/** 절대 주소의 origin. NEXT_PUBLIC_SITE_URL 이 있으면 그것을, 없으면 요청 헤더를 쓴다. */
export async function siteOrigin(): Promise<string> {
  // 직접 정한 주소가 있으면 그것을 (형식이 조금 틀려도 고쳐서) 쓴다
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#1F1D2B", light: "#FFFFFF" } });
}
