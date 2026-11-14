import "server-only";
import { cookies } from "next/headers";
import { hmac, hmacEquals } from "@/lib/server/secret";

/**
 * "내가 쓴 메시지" 기억하기. 참여 링크 경로(/w/{code})에만 보내지는 서명 쿠키에 메시지 id 를 담는다.
 * 쿠키를 고쳐 남의 id 를 넣어도 서명이 맞지 않으면 버린다. (수정·삭제는 어차피 비밀번호가 필요하다.)
 */
const MAX_IDS = 10;
const cookieName = (boardId: string) => `mm_my_${boardId.replace(/-/g, "").slice(0, 16)}`;
const sign = (boardId: string, payload: string) => hmac(`my:${boardId}`, payload).slice(0, 32);

export async function readMyMessageIds(boardId: string): Promise<string[]> {
  const raw = (await cookies()).get(cookieName(boardId))?.value;
  if (!raw) return [];
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return [];
  const payload = raw.slice(0, dot);
  if (!hmacEquals(raw.slice(dot + 1), sign(boardId, payload))) return [];
  return payload.split(",").filter((id) => /^[0-9a-f-]{36}$/.test(id));
}

/** 서버 액션 전용 */
export async function writeMyMessageIds(boardId: string, joinCode: string, ids: string[]): Promise<void> {
  const store = await cookies();
  const unique = [...new Set(ids)].slice(-MAX_IDS);
  if (!unique.length) {
    store.delete({ name: cookieName(boardId), path: `/w/${joinCode}` });
    return;
  }
  const payload = unique.join(",");
  store.set(cookieName(boardId), `${payload}.${sign(boardId, payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/w/${joinCode}`,
    maxAge: 60 * 60 * 24 * 180,
  });
}

export async function rememberMyMessage(boardId: string, joinCode: string, messageId: string) {
  await writeMyMessageIds(boardId, joinCode, [...(await readMyMessageIds(boardId)), messageId]);
}

export async function forgetMyMessage(boardId: string, joinCode: string, messageId: string) {
  await writeMyMessageIds(
    boardId,
    joinCode,
    (await readMyMessageIds(boardId)).filter((id) => id !== messageId),
  );
}
