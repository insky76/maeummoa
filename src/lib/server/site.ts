import "server-only";
import { headers } from "next/headers";
import QRCode from "qrcode";

/** 절대 주소의 origin. NEXT_PUBLIC_SITE_URL 이 있으면 그것을, 없으면 요청 헤더를 쓴다. */
export async function siteOrigin(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#1F1D2B", light: "#FFFFFF" } });
}
