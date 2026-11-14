import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { env } from "@/lib/env";

export function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/** 요청 본문을 스키마로 검증. 실패하면 첫 오류 메시지로 400 응답을 돌려준다. */
export async function parseBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: jsonError(400, "요청 형식이 올바르지 않아요.") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, response: jsonError(400, parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.") };
  }
  return { ok: true, data: parsed.data };
}

/** 키가 연결되지 않은 환경에서는 API 가 500 대신 안내를 돌려주게 한다. */
export function notConfigured() {
  return env.isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? null
    : jsonError(503, "서버 설정(Supabase 키)이 아직 연결되지 않았어요.");
}
