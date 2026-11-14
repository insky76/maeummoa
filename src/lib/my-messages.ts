/**
 * 이 기기에서 쓴 메시지 기억 (브라우저 localStorage).
 * 편의 기능일 뿐 권한이 아니다. 수정·삭제는 항상 비밀번호로 확인한다.
 * 사파리 비공개 모드 등에서 저장소가 막혀 있어도 동작이 깨지지 않게 모두 try/catch 한다.
 */
export interface MyMessageRef {
  id: string;
  nickname: string;
  at: string;
}

const key = (code: string) => `maeummoa:mine:${code}`;

export function loadMyMessages(code: string): MyMessageRef[] {
  try {
    const raw = window.localStorage.getItem(key(code));
    const list = raw ? (JSON.parse(raw) as MyMessageRef[]) : [];
    return Array.isArray(list) ? list.filter((m) => typeof m?.id === "string") : [];
  } catch {
    return [];
  }
}

export function rememberMyMessage(code: string, ref: MyMessageRef) {
  try {
    const list = loadMyMessages(code).filter((m) => m.id !== ref.id);
    window.localStorage.setItem(key(code), JSON.stringify([ref, ...list].slice(0, 20)));
  } catch {
    // 저장 실패는 무시 (이름+비밀번호로 다시 찾을 수 있다)
  }
}

export function forgetMyMessage(code: string, id: string) {
  try {
    const list = loadMyMessages(code).filter((m) => m.id !== id);
    window.localStorage.setItem(key(code), JSON.stringify(list));
  } catch {
    // 무시
  }
}
