"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createBoardSchema, type CreateBoardInput } from "@/lib/validation";
import { deadlineFromDate } from "@/lib/date";
import { newGiftCode, newJoinCode } from "@/lib/codes";
import { env } from "@/lib/env";

export type CreateBoardResult = { ok: false; error: string; field?: keyof CreateBoardInput };

const UNIQUE_VIOLATION = "23505";

export async function createBoard(input: CreateBoardInput): Promise<CreateBoardResult> {
  const parsed = createBoardSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: issue.path[0] as keyof CreateBoardInput };
  }
  const v = parsed.data;

  if (!env.isSupabaseConfigured()) {
    return { ok: false, error: "Supabase 키가 아직 연결되지 않아 보드를 저장할 수 없어요." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "로그인이 필요해요. 다시 로그인해 주세요." };
  }

  // 서프라이즈 OFF: 주인공이 모으는 동안에도 볼 수 있도록 선물 링크를 바로 만든다.
  let boardId: string | null = null;
  try {
    for (let attempt = 0; attempt < 3 && !boardId; attempt++) {
      const { data, error } = await supabase
        .from("boards")
        .insert({
          owner_id: user.id,
          recipient_name: v.recipientName,
          occasion: v.occasion,
          theme: v.theme,
          title: v.title,
          intro: v.intro || null,
          deadline_at: deadlineFromDate(v.deadlineDate),
          join_code: newJoinCode(),
          gift_code: v.optSurprise ? null : newGiftCode(),
          opt_preview_messages: v.optPreviewMessages,
          opt_require_approval: v.optRequireApproval,
          opt_surprise: v.optSurprise,
          opt_public_result: v.optPublicResult,
        })
        .select("id")
        .single();

      if (!error) {
        boardId = data.id;
      } else if (error.code !== UNIQUE_VIOLATION) {
        console.error("createBoard failed", error);
        return { ok: false, error: "보드를 만들지 못했어요. 잠시 후 다시 시도해 주세요." };
      }
      // 코드가 우연히 겹치면 새 코드로 다시 시도
    }
  } catch (e) {
    // 네트워크 오류 등 예상 못 한 예외도 위자드 입력이 사라지지 않게 결과로 돌려준다
    console.error("createBoard threw", e);
    return { ok: false, error: "보드를 만들지 못했어요. 잠시 후 다시 시도해 주세요." };
  }

  if (!boardId) {
    return { ok: false, error: "보드를 만들지 못했어요. 잠시 후 다시 시도해 주세요." };
  }

  redirect(`/boards/${boardId}/share?created=1`);
}
