"use server";

import { revalidatePath } from "next/cache";
import { giftAccess } from "@/lib/gift-access";
import { getBoardByGiftCode } from "@/lib/server/public-boards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string; needLogin?: boolean };

async function currentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  return user?.id ?? null;
}

/** 받은 보드 보관함에 추가. 선물 코드로 볼 수 있는 보드만 보관된다. */
export async function saveGift(code: string): Promise<Result> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "로그인이 필요해요.", needLogin: true };
  const board = await getBoardByGiftCode(code);
  if (!board) return { ok: false, error: "선물을 찾을 수 없어요." };
  if (board.owner_id === userId) return { ok: false, error: "내가 만든 보드는 '만든 보드'에 있어요." };
  if (giftAccess(board, userId).kind !== "ok") return { ok: false, error: "아직 열 수 없는 선물이에요." };

  const { error } = await createAdminClient()
    .from("saved_gifts")
    .upsert({ user_id: userId, board_id: board.id }, { onConflict: "user_id,board_id", ignoreDuplicates: true });
  if (error) {
    console.error("saveGift failed", error);
    return { ok: false, error: "보관하지 못했어요. 잠시 뒤에 다시 시도해 주세요." };
  }
  revalidatePath("/me");
  return { ok: true };
}

/** 비공개 선물: 지금 로그인한 계정을 주인공으로 정하고 보관함에도 넣는다 */
export async function claimGift(code: string): Promise<Result> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "로그인이 필요해요.", needLogin: true };
  const board = await getBoardByGiftCode(code);
  if (!board) return { ok: false, error: "선물을 찾을 수 없어요." };
  const access = giftAccess(board, userId);
  if (access.kind !== "claim" && access.kind !== "ok") return { ok: false, error: "받을 수 없는 선물이에요." };

  const admin = createAdminClient();
  const { data: claimed, error } = await admin.rpc("mm_claim_gift", { p_board_id: board.id, p_user_id: userId });
  if (error || !claimed) {
    if (error) console.error("claimGift failed", error);
    return { ok: false, error: "다른 분이 먼저 받은 선물이에요." };
  }
  await admin.from("saved_gifts").upsert({ user_id: userId, board_id: board.id }, { onConflict: "user_id,board_id", ignoreDuplicates: true });
  revalidatePath(`/g/${code}`);
  revalidatePath("/me");
  return { ok: true };
}
