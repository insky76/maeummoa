import { z } from "zod";
import { LIMITS, THEMES, type ThemeKey } from "@/lib/domain";
import { addDays, todayKST } from "@/lib/date";

const availableThemes = (Object.keys(THEMES) as ThemeKey[]).filter((k) => THEMES[k].available);

/** 'YYYY-MM-DD' 가 실제 달력에 있는 날짜인지 (2026-02-31, 2026-11-99 거부) */
export function isCalendarDate(d: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const t = Date.parse(`${d}T00:00:00Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === d;
}

/** 마감일은 오늘부터 60일 이내 */
export const MAX_DEADLINE_DAYS = 60;

export const createBoardSchema = z.object({
  recipientName: z
    .string()
    .trim()
    .min(1, "주인공 이름을 입력해 주세요.")
    .max(LIMITS.recipientName, `주인공 이름은 ${LIMITS.recipientName}자까지 쓸 수 있어요.`),
  occasion: z.enum(["birthday", "pass", "leave", "cheer", "coworker", "etc"]),
  theme: z.enum(availableThemes as [ThemeKey, ...ThemeKey[]], { message: "아직 고를 수 없는 테마예요." }),
  title: z
    .string()
    .trim()
    .min(1, "보드 제목을 입력해 주세요.")
    .max(LIMITS.title, `제목은 ${LIMITS.title}자까지 쓸 수 있어요.`),
  intro: z.string().trim().max(LIMITS.intro, `한마디는 ${LIMITS.intro}자까지 쓸 수 있어요.`),
  deadlineDate: z
    .string()
    .refine(isCalendarDate, "마감일을 골라 주세요.")
    .refine((d) => d >= todayKST(), "마감일은 오늘 이후로 골라 주세요.")
    .refine((d) => d <= addDays(todayKST(), MAX_DEADLINE_DAYS), `마감일은 ${MAX_DEADLINE_DAYS}일 이내로 골라 주세요.`),
  optPreviewMessages: z.boolean(),
  optRequireApproval: z.boolean(),
  optSurprise: z.boolean(),
  optPublicResult: z.boolean(),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;

/** 참여자 메시지 작성 */
export const messageSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(1, "이름을 입력해 주세요.")
    .max(LIMITS.nickname, `이름은 ${LIMITS.nickname}자까지 쓸 수 있어요.`),
  body: z
    .string()
    .trim()
    .min(1, "메시지를 입력해 주세요.")
    .max(LIMITS.body, `메시지는 ${LIMITS.body}자까지 쓸 수 있어요.`),
  password: z.string().regex(/^\d{4}$/, "비밀번호는 숫자 4자리로 정해 주세요."),
  variant: z.string().max(20),
});

export type MessageInput = z.infer<typeof messageSchema>;

export const passwordSchema = z.string().regex(/^\d{4}$/, "숫자 4자리를 입력해 주세요.");

export const bodySchema = messageSchema.shape.body;

/** 마감일 (보드 만들기·마감 연장 공통) */
export const deadlineDateSchema = createBoardSchema.shape.deadlineDate;

/** 보드 설정 변경 */
export const settingsSchema = z.object({
  optPreviewMessages: z.boolean(),
  optRequireApproval: z.boolean(),
  optSurprise: z.boolean(),
  optPublicResult: z.boolean(),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
