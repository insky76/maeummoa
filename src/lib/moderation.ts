/**
 * 금칙어 필터 (1차). 띄어쓰기·특수문자·숫자를 끼워 넣어 피하는 경우("시 1 발")까지 잡도록
 * 정규화한 뒤 포함 여부를 본다.
 *
 * 응원 문장에 흔한 표현은 넣지 않는다. 예: "죽어도 응원해"(죽어), "시바견"(시바), "불 꺼져도"(꺼져).
 * 목록은 운영하면서 계속 다듬는다. 신고·개설자 숨김이 2차 방어선이다.
 */
const BLOCKED = [
  // 욕설
  "시발", "씨발", "씨빨", "씨팔", "시팔", "ㅅㅂ", "ㅆㅂ", "ㅅ ㅂ",
  "병신", "븅신", "빙신", "ㅂㅅ",
  "좆", "존나", "졸라", "ㅈㄴ",
  "지랄", "ㅈㄹ",
  "개새", "개색", "개세끼", "ㄱㅅㄲ",
  "미친년", "미친놈", "미친새",
  "염병", "엿먹",
  "닥쳐", "꺼지라",
  "뒤져라", "뒤지라", "죽어라", "죽어버려",
  // 영어
  "fuck", "shit", "bitch", "asshole",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFC")
    .replace(/[\s\d!-/:-@[-`{-~·…ㆍ_]+/g, "");
}

const NORMALIZED = BLOCKED.map(normalize);

/** 금칙어가 있으면 true */
export function containsBlockedWord(...texts: string[]): boolean {
  return texts.some((t) => {
    const n = normalize(t);
    return NORMALIZED.some((w) => w && n.includes(w));
  });
}
