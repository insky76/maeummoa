/**
 * 금칙어 필터 (참여자 닉네임·메시지).
 * 띄어쓰기·기호·숫자를 끼워 넣는 우회를 막기 위해 한글·영문만 남겨 비교한다.
 * 목록은 시작용이다. 운영하며 신고된 표현을 보고 늘린다.
 * "새끼손가락"처럼 정상 단어에 섞이는 짧은 말은 넣지 않는다.
 */
const BANNED = [
  "시발", "씨발", "씨바", "씨빨", "시바알", "ㅅㅂ", "ㅆㅂ",
  "병신", "븅신", "빙신", "ㅂㅅ", "ㅄ",
  "좆", "존나", "졸라",
  "개새끼", "개새기", "개색기", "개세끼",
  "지랄", "ㅈㄹ",
  "미친놈", "미친년", "미친새끼",
  "엠창", "느금마", "니애미", "니미럴",
  "닥쳐", "꺼져",
  "fuck", "shit", "bitch",
];

/** 비교용으로 정규화: 소문자, 한글(자모 포함)·영문만 남김 */
export function normalizeForFilter(text: string): string {
  return text.toLowerCase().replace(/[^a-z가-힣ㄱ-ㅎㅏ-ㅣ]/g, "");
}

export function containsBannedWord(text: string): boolean {
  const n = normalizeForFilter(text);
  return BANNED.some((w) => n.includes(w));
}
