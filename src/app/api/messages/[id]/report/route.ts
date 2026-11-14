import { NextResponse } from "next/server";
import { reportSchema } from "@/lib/validation";
import { jsonError, notConfigured, parseBody } from "@/lib/server/api";
import { clientHash } from "@/lib/server/client-hash";
import { createAdminClient } from "@/lib/supabase/admin";

/** 메시지 신고. 같은 기기에서 같은 메시지는 한 번만 센다. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const nc = notConfigured();
  if (nc) return nc;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return jsonError(404, "메시지를 찾을 수 없어요.");

  const parsed = await parseBody(request, reportSchema);
  if (!parsed.ok) return parsed.response;

  const admin = createAdminClient();
  const { data: msg } = await admin
    .from("messages")
    .select("id, board_id, report_count")
    .eq("id", id)
    .eq("status", "visible")
    .maybeSingle();
  if (!msg) return jsonError(404, "메시지를 찾을 수 없어요.");

  const ch = clientHash(request, msg.board_id);
  const { count } = await admin
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("message_id", id)
    .eq("client_hash", ch);
  if (count) return NextResponse.json({ ok: true, duplicate: true });

  await admin.from("reports").insert({ message_id: id, reason: parsed.data.reason ?? null, client_hash: ch });
  await admin.from("messages").update({ report_count: (msg.report_count ?? 0) + 1 }).eq("id", id);

  return NextResponse.json({ ok: true });
}
