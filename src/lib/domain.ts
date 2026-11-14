/**
 * 마음모아 도메인 상수: 상황, 테마, 테마별 문구, 기본 정책.
 * 테마는 "겉옷"이다. 메시지 데이터 구조는 같고, 보이는 모습과 문구만 바뀐다.
 */

export type ThemeKey = "flower" | "star" | "note" | "light" | "letter";
export type OccasionKey = "birthday" | "pass" | "leave" | "cheer" | "coworker" | "etc";
export type BoardStatus = "collecting" | "closed" | "delivered";

export interface ThemeCopy {
  key: ThemeKey;
  label: string;        // 테마 이름 (보드 만들기 화면)
  description: string;
  unit: string;         // 메시지 단위: "송이", "개", "장"
  item: string;         // 메시지 하나: "꽃 한 송이"
  writeCta: string;     // 참여 버튼: "꽃 한 송이 꽂기"
  submitCta: string;    // 작성 완료 버튼: "꽃 꽂기"
  sceneName: (recipient: string) => string; // 결과 화면 이름
  sceneLabel: string;   // 결과 화면 탭 이름: "꽃다발"
  countLine: (n: number) => string;  // 참여·결과 화면: "12명이 꽃을 꽂았어요"
  doneTitle: (n: number) => string;  // 작성 완료: "13번째 꽃이 꽂혔어요!"
  openingLine: (n: number) => string; // 오프닝: "14명이 마음을 모아 / 꽃다발을 만들었어요"
  tapHint: string;      // "꽃을 눌러 메시지를 읽어 보세요"
  available: boolean;   // 첫 출시 포함 여부
}

export const THEMES: Record<ThemeKey, ThemeCopy> = {
  flower: {
    key: "flower",
    label: "꽃다발",
    description: "메시지 하나가 꽃 한 송이가 돼요",
    unit: "송이",
    item: "꽃",
    writeCta: "꽃 한 송이 꽂기",
    submitCta: "꽃 꽂기",
    sceneName: (r) => `${r}의 꽃다발`,
    sceneLabel: "꽃다발",
    countLine: (n) => `${n}명이 꽃을 꽂았어요`,
    doneTitle: (n) => `${n}번째 꽃이 꽂혔어요!`,
    openingLine: (n) => `${n}명이 마음을 모아\n꽃다발을 만들었어요`,
    tapHint: "꽃을 눌러 메시지를 읽어 보세요",
    available: true,
  },
  star: {
    key: "star",
    label: "밤하늘",
    description: "메시지 하나가 별 하나가 돼요",
    unit: "개",
    item: "별",
    writeCta: "별 띄우기",
    submitCta: "별 띄우기",
    sceneName: (r) => `${r}의 밤하늘`,
    sceneLabel: "밤하늘",
    countLine: (n) => `${n}개의 별이 떴어요`,
    doneTitle: (n) => `${n}번째 별이 떴어요!`,
    openingLine: (n) => `${n}명이 마음을 모아\n밤하늘을 채웠어요`,
    tapHint: "별을 눌러 메시지를 읽어 보세요",
    available: true,
  },
  note: {
    key: "note",
    label: "쪽지 벽",
    description: "알록달록 쪽지를 벽에 붙여요",
    unit: "장",
    item: "쪽지",
    writeCta: "쪽지 붙이기",
    submitCta: "쪽지 붙이기",
    sceneName: (r) => `${r}의 메모 벽`,
    sceneLabel: "쪽지 벽",
    countLine: (n) => `쪽지 ${n}장이 붙었어요`,
    doneTitle: (n) => `${n}번째 쪽지가 붙었어요!`,
    openingLine: (n) => `${n}명이 마음을 모아\n쪽지를 붙였어요`,
    tapHint: "쪽지를 눌러 크게 읽어 보세요",
    available: true,
  },
  light: {
    key: "light",
    label: "응원봉",
    description: "객석에 응원봉 불빛을 밝혀요",
    unit: "개",
    item: "응원봉",
    writeCta: "불 밝히기",
    submitCta: "불 밝히기",
    sceneName: (r) => `${r}을 위한 객석`,
    sceneLabel: "객석",
    countLine: (n) => `${n}개의 불빛이 켜졌어요`,
    doneTitle: (n) => `${n}번째 불빛이 켜졌어요!`,
    openingLine: (n) => `${n}명이 마음을 모아\n객석을 밝혔어요`,
    tapHint: "응원봉을 눌러 메시지를 읽어 보세요",
    available: false,
  },
  letter: {
    key: "letter",
    label: "편지함",
    description: "편지 한 통씩 우체통에 넣어요",
    unit: "통",
    item: "편지",
    writeCta: "편지 넣기",
    submitCta: "편지 넣기",
    sceneName: (r) => `${r}의 우체통`,
    sceneLabel: "우체통",
    countLine: (n) => `편지 ${n}통이 도착했어요`,
    doneTitle: (n) => `${n}번째 편지가 들어갔어요!`,
    openingLine: (n) => `${n}명이 마음을 모아\n편지를 보냈어요`,
    tapHint: "편지를 눌러 읽어 보세요",
    available: false,
  },
};

export interface Occasion {
  key: OccasionKey;
  label: string;
  recommendedTheme: ThemeKey;
  /** 서프라이즈 모드 기본값. ON: 전달할 때 선물 링크 생성 / OFF: 모으는 동안 주인공이 실시간으로 봄 */
  defaultSurprise: boolean;
}

export const OCCASIONS: Occasion[] = [
  { key: "birthday", label: "생일", recommendedTheme: "flower", defaultSurprise: true },
  { key: "pass", label: "합격·축하", recommendedTheme: "flower", defaultSurprise: true },
  { key: "leave", label: "퇴사·새출발", recommendedTheme: "star", defaultSurprise: true },
  { key: "cheer", label: "위로·응원", recommendedTheme: "star", defaultSurprise: false },
  { key: "coworker", label: "동료에게", recommendedTheme: "note", defaultSurprise: true },
  { key: "etc", label: "기타", recommendedTheme: "note", defaultSurprise: true },
];

export function getOccasion(key: OccasionKey): Occasion {
  return OCCASIONS.find((o) => o.key === key) ?? OCCASIONS[OCCASIONS.length - 1];
}

/** 메시지 제한 */
export const LIMITS = {
  recipientName: 30,
  title: 60,
  intro: 300,
  nickname: 20,
  body: 300,
  passwordDigits: 4,
  passwordMaxTries: 5,
  passwordLockMinutes: 10,
  /** 같은 기기: 한 보드에 다음 메시지까지 기다리는 시간(초), 하루 최대 개수 */
  deviceCooldownSec: 30,
  devicePerDay: 5,
  /** 같은 네트워크(IP): 한 보드에 한 시간 최대 개수. 사무실처럼 여럿이 같은 IP 를 쓰는 경우를 생각해 넉넉하게 */
  ipPerHour: 30,
  /** 예약 공개는 지금부터 30일 이내 */
  revealMaxDays: 30,
  /** 이 개수 이상이면 장면을 넓게 펼친다 (꽃밭·은하수) */
  sceneExpandAt: 50,
} as const;
