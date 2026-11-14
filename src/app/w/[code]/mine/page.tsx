import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { getBoardByJoinCode } from "@/lib/server/public-boards";
import { MineClient } from "./MineClient";

export const metadata: Metadata = { title: "내 메시지", robots: { index: false, follow: false } };

export default async function MinePage({ params }: { params: Promise<{ code: string }> }) {
  if (!env.isSupabaseConfigured()) notFound();
  const { code } = await params;
  const board = await getBoardByJoinCode(code);
  if (!board) notFound();
  return <MineClient code={board.join_code} title={board.title} />;
}
