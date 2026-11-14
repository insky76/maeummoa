/** 받침 유무로 조사 고르기: 꽃을 / 쪽지를, 지수가 / 민지가 등 */
function hasBatchim(word: string): boolean {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false; // 한글 음절이 아니면 받침 없음으로 본다
  return (code - 0xac00) % 28 !== 0;
}

export const eulReul = (w: string) => `${w}${hasBatchim(w) ? "을" : "를"}`;
export const iGa = (w: string) => `${w}${hasBatchim(w) ? "이" : "가"}`;
export const eunNeun = (w: string) => `${w}${hasBatchim(w) ? "은" : "는"}`;
