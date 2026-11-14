import { NextResponse } from "next/server";
import { passwordOnlySchema } from "@/lib/validation";
import { jsonError, notConfigured, parseBody } from "@/lib/server/api";
import { authorizeMessage } from "@/lib/server/message-auth";

/** 수정 화면을 열기 전에 비밀번호만 확인 (실패 횟수에 포함된다) */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const nc = notConfigured();
  if (nc) return nc;
  const { id } = await params;

  const parsed = await parseBody(request, passwordOnlySchema);
  if (!parsed.ok) return parsed.response;

  const auth = await authorizeMessage(id, parsed.data.password);
  if (!auth.ok) return jsonError(auth.status, auth.error);
  return NextResponse.json({ ok: true });
}
