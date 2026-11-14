import "server-only";
import { createHash } from "node:crypto";

/**
 * 같은 기기·네트워크에서의 연속 작성을 제한하기 위한 식별값.
 * IP·User-Agent 원문은 저장하지 않고, 보드별로 다른 해시만 남긴다 (보드 간 추적 불가).
 */
export function clientHash(request: Request, boardId: string): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const ua = request.headers.get("user-agent") ?? "";
  const salt = process.env.HASH_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "maeummoa";
  return createHash("sha256").update(`${salt}|${boardId}|${ip}|${ua}`).digest("hex").slice(0, 32);
}
