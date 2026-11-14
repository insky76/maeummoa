/**
 * 한국어 조사 붙이기. 이름 끝 글자에 받침이 있는지 보고 고른다.
 * josa("지수", "이/가") → "지수가", josa("준호", "을/를") → "준호를", josa("민준", "아/야") → "민준아"
 * 한글이 아닌 끝 글자(영문·숫자)는 받침 없는 쪽을 쓴다.
 */
export type JosaPair = "이/가" | "을/를" | "은/는" | "과/와" | "아/야" | "이에게/에게" | "으로/로";

export function hasBatchim(word: string): boolean {
  const last = word.trim().slice(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function hasRieulBatchim(word: string): boolean {
  const code = word.trim().slice(-1).charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 === 8;
}

export function josa(word: string, pair: JosaPair): string {
  const [withB, withoutB] = pair.split("/");
  if (pair === "으로/로") {
    // ㄹ 받침 뒤에는 "로"
    return word + (hasBatchim(word) && !hasRieulBatchim(word) ? withB : withoutB);
  }
  if (pair === "이에게/에게") return word + "에게";
  return word + (hasBatchim(word) ? withB : withoutB);
}
