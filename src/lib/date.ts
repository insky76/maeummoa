/**
 * 날짜는 모두 한국 시간(KST, UTC+9) 기준으로 다룬다.
 * 마감일은 "그날 23:59:59 KST" 로 저장하고 화면에는 "자정" 으로 표시한다.
 */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** KST 기준 오늘 날짜 'YYYY-MM-DD' */
export function todayKST(now: Date = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** 'YYYY-MM-DD' 에 n 일 더하기 */
export function addDays(date: string, n: number): string {
  const t = Date.parse(`${date}T00:00:00Z`) + n * DAY_MS;
  return new Date(t).toISOString().slice(0, 10);
}

/** 'YYYY-MM-DD' → 그날 23:59:59 KST 의 ISO 문자열 */
export function deadlineFromDate(date: string): string {
  return new Date(`${date}T23:59:59+09:00`).toISOString();
}

/** ISO → KST 날짜 'YYYY-MM-DD' */
export function toKSTDate(iso: string): string {
  return todayKST(new Date(iso));
}

/** 'YYYY-MM-DD' 또는 ISO → "11월 16일 (월)" */
export function formatDateKo(dateOrIso: string): string {
  const d = dateOrIso.length === 10 ? dateOrIso : toKSTDate(dateOrIso);
  const [, m, day] = d.split("-").map(Number);
  const wd = new Date(`${d}T00:00:00Z`).getUTCDay();
  return `${m}월 ${day}일 (${WEEKDAYS[wd]})`;
}

/** 마감까지 남은 날 수 (KST 날짜 기준). 오늘 마감이면 0, 지났으면 음수 */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const a = Date.parse(`${todayKST(now)}T00:00:00Z`);
  const b = Date.parse(`${toKSTDate(iso)}T00:00:00Z`);
  return Math.round((b - a) / DAY_MS);
}

/** "D-7", "D-DAY" */
export function ddayLabel(iso: string, now: Date = new Date()): string {
  const n = daysUntil(iso, now);
  return n === 0 ? "D-DAY" : n > 0 ? `D-${n}` : "마감";
}
