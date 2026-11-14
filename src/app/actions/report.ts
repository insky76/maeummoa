"use server";

import { deviceHash, ensureDeviceId } from "@/lib/server/device";
import { createAdminClient } from "@/lib/supabase/admin";

export type ReportResult = { ok: true; already: boolean } | { ok: false; error: string };

/** 메시지 신고. 같은 기기는 한 메시지에 한 번만 신고된다. 개설자 관리 화면에 신고 수가 보인다. */
export async function reportMessage(messageId: string, reason?: string): Promise<ReportResult> {
  if (!/^[0-9a-f-]{36}$/.test(messageId)) return { ok: false, error: "메시지를 찾을 수 없어요." };
  const admin = createAdminClient();
  const { data: m } = await admin.from("messages").select("id, status").eq("id", messageId).maybeSingle();
  if (!m || m.status !== "visible") return { ok: false, error: "메시지를 찾을 수 없어요." };

  const device = deviceHash(await ensureDeviceId());
  const { data, error } = await admin.rpc("mm_report_message", {
    p_message_id: messageId,
    p_client_hash: device,
    p_reason: (reason ?? "").slice(0, 200) || null,
  });
  if (error) {
    console.error("reportMessage failed", error);
    return { ok: false, error: "신고하지 못했어요. 잠시 뒤에 다시 시도해 주세요." };
  }
  return { ok: true, already: data === false };
}
