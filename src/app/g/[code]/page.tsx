import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { GiftView } from "@/components/gift/GiftView";
import { THEMES } from "@/lib/domain";
import { effectiveStatus, giftPath } from "@/lib/boards";
import { formatDateTimeKo } from "@/lib/date";
import { env } from "@/lib/env";
import { giftAccess } from "@/lib/gift-access";
import { getBoardByGiftCode, listVisibleMessages } from "@/lib/server/public-boards";
import { siteOrigin } from "@/lib/server/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { claimGift, saveGift } from "./actions";
import { ClaimButton } from "./ClaimButton";

type Props = { params: Promise<{ code: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const board = await getBoardByGiftCode(code);
  if (!board) return { title: "선물을 찾을 수 없어요" };
  // 미리보기에는 메시지 내용을 드러내지 않는다
  const title = `${board.recipient_name}님에게 도착한 선물`;
  const description = `${THEMES[board.theme].sceneName(board.recipient_name)} · 마음모아`;
  return { title: { absolute: title }, description, openGraph: { title, description }, robots: { index: false } };
}

export default async function GiftPage({ params }: Props) {
  const { code } = await params;
  const board = await getBoardByGiftCode(code);
  if (!board) notFound();

  // 메시지는 미리 불러오기 시작한다 (볼 수 없는 경우엔 쓰지 않고 버린다)
  const messagesPromise = listVisibleMessages(board.id);

  let userId: string | null = null;
  if (env.isSupabaseConfigured()) {
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();
    userId = user?.id ?? null;
  }

  const access = giftAccess(board, userId);

  if (access.kind !== "ok") {
    return (
      <Notice>
        {access.kind === "wrapping" && (
          <>
            <h1 className="font-display text-2xl font-bold">선물이 아직 포장 중이에요</h1>
            <p className="text-sm leading-relaxed text-ink-sub">
              {access.revealAt ? (
                <>
                  {formatDateTimeKo(access.revealAt)}에 열려요.
                  <br />
                  조금만 기다려 주세요.
                </>
              ) : (
                <>친구들이 {board.recipient_name}님을 위해 마음을 모으고 있어요. 선물이 완성되면 이 링크로 열 수 있어요.</>
              )}
            </p>
          </>
        )}
        {access.kind === "login" && (
          <>
            <h1 className="font-display text-2xl font-bold">{board.recipient_name}님만 볼 수 있는 선물이에요</h1>
            <p className="text-sm leading-relaxed text-ink-sub">로그인하면 선물을 받을 수 있어요.</p>
            <Link
              href={`/login?next=${encodeURIComponent(giftPath(code))}`}
              className="mt-2 flex h-[54px] w-full items-center justify-center rounded-2xl bg-brand text-base font-bold text-white"
            >
              로그인하고 선물 받기
            </Link>
          </>
        )}
        {access.kind === "claim" && (
          <>
            <h1 className="font-display text-2xl font-bold">{board.recipient_name}님에게 온 선물이에요</h1>
            <p className="text-sm leading-relaxed text-ink-sub">
              이 선물은 한 사람만 열 수 있어요. 지금 로그인한 계정으로 받을까요?
              <br />
              받은 뒤에는 다른 계정에서 열 수 없어요.
            </p>
            <ClaimButton action={claimGift.bind(null, code)} />
          </>
        )}
        {access.kind === "private" && (
          <>
            <h1 className="font-display text-2xl font-bold">비공개 선물이에요</h1>
            <p className="text-sm leading-relaxed text-ink-sub">이미 다른 계정에서 받은 선물이라 열 수 없어요.</p>
          </>
        )}
      </Notice>
    );
  }

  const [messages, origin, saved] = await Promise.all([
    messagesPromise,
    siteOrigin(),
    userId && !access.asOwner
      ? createAdminClient()
          .from("saved_gifts")
          .select("board_id")
          .eq("user_id", userId)
          .eq("board_id", board.id)
          .maybeSingle()
          .then(({ data }) => !!data)
      : Promise.resolve(false),
  ]);

  return (
    <GiftView
      board={{ id: board.id, title: board.title, theme: board.theme, recipient_name: board.recipient_name }}
      messages={messages}
      mode="gift"
      giftUrl={`${origin}${giftPath(code)}`}
      imageUrl={`${giftPath(code)}/image`}
      live={!board.opt_surprise && effectiveStatus(board) === "collecting"}
      canSave={!access.asOwner}
      saved={saved}
      saveAction={saveGift.bind(null, code)}
    />
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white">
      <header className="flex h-14 items-center px-5">
        <Link href="/" className="flex items-center gap-1.5 font-display text-[15px] font-bold text-brand-strong">
          <Logo size={18} />
          마음모아
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 pb-20 text-center">
        <svg width="96" height="96" viewBox="0 0 180 180" aria-hidden="true" className="mb-2">
          <rect x="34" y="78" width="112" height="84" rx="8" fill="#FCE8EC" />
          <rect x="26" y="60" width="128" height="28" rx="6" fill="#F6DCE2" />
          <rect x="82" y="60" width="16" height="102" fill="#C2375A" />
          <path d="M90 60 C72 30 46 36 54 54 C58 62 76 62 90 60Z" fill="#C2375A" />
          <path d="M90 60 C108 30 134 36 126 54 C122 62 104 62 90 60Z" fill="#C2375A" />
        </svg>
        {children}
      </main>
    </div>
  );
}
