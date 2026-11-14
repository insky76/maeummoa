import { describe, expect, it } from "vitest";
import { containsBlockedWord } from "@/lib/moderation";
import { eulReul, iGa } from "@/lib/josa";
import { addDays, daysUntil, ddayLabel, deadlineFromDate, formatDateKo, todayKST } from "@/lib/date";
import { effectiveStatus } from "@/lib/boards";
import { isValidVariant, resolveVariant } from "@/lib/theme-styles";
import { safeNextPath } from "@/lib/safe-next";

describe("금칙어", () => {
  it.each(["야 씨발", "시 1 발", "병.신아", "FUCK you", "ㅅㅂ"])("막는다: %s", (t) => {
    expect(containsBlockedWord(t)).toBe(true);
  });
  it.each(["죽어도 응원해!", "우리집 시바견도 축하해", "불이 꺼져도 빛나는 너", "생일 축하해 지수야 사랑해"])(
    "응원 문장은 통과: %s",
    (t) => expect(containsBlockedWord(t)).toBe(false),
  );
  it("이름도 함께 검사한다", () => expect(containsBlockedWord("ㅅㅂ", "좋은 하루")).toBe(true));
});

describe("조사", () => {
  it("을/를", () => {
    expect(eulReul("꽃")).toBe("꽃을");
    expect(eulReul("쪽지")).toBe("쪽지를");
  });
  it("이/가", () => {
    expect(iGa("지수")).toBe("지수가");
    expect(iGa("지수의 꽃다발")).toBe("지수의 꽃다발이");
  });
});

describe("날짜 (KST)", () => {
  const now = new Date("2026-11-14T16:30:00Z"); // KST 11월 15일 01:30
  it("UTC 와 날짜가 다른 새벽에도 KST 날짜를 쓴다", () => expect(todayKST(now)).toBe("2026-11-15"));
  it("월이 바뀌는 날짜 더하기", () => expect(addDays("2026-11-28", 7)).toBe("2026-12-05"));
  it("마감은 그날 23:59:59 KST", () => expect(deadlineFromDate("2026-11-16")).toBe("2026-11-16T14:59:59.000Z"));
  it("D-day", () => {
    expect(daysUntil("2026-11-16T14:59:59.000Z", now)).toBe(1);
    expect(ddayLabel("2026-11-15T14:59:59.000Z", now)).toBe("D-DAY");
  });
  it("표시 형식", () => expect(formatDateKo("2026-11-16T14:59:59.000Z")).toBe("11월 16일 (월)"));
});

describe("보드 상태", () => {
  const now = new Date("2026-11-14T16:30:00Z");
  it("마감 전이면 모으는 중", () =>
    expect(effectiveStatus({ status: "collecting", deadline_at: "2026-11-16T14:59:59.000Z" }, now)).toBe("collecting"));
  it("마감 시각이 지나면 자동으로 마감", () =>
    expect(effectiveStatus({ status: "collecting", deadline_at: "2026-11-14T14:59:59.000Z" }, now)).toBe("closed"));
  it("전달된 보드는 그대로", () =>
    expect(effectiveStatus({ status: "delivered", deadline_at: "2026-11-01T00:00:00Z" }, now)).toBe("delivered"));
});

describe("테마 꾸밈", () => {
  it("테마별 선택지만 허용", () => {
    expect(isValidVariant("flower", "tulip")).toBe(true);
    expect(isValidVariant("star", "tulip")).toBe(false);
  });
  it("모르는 값은 첫 번째로 대체", () => {
    expect(resolveVariant("note", { variant: "zzz" }).key).toBe("yellow");
    expect(resolveVariant("star", null).key).toBe("cream");
  });
});

describe("로그인 후 이동 경로", () => {
  it("내부 경로만 허용", () => {
    expect(safeNextPath("/me")).toBe("/me");
    expect(safeNextPath("//evil.com")).toBe("/new");
    expect(safeNextPath("https://evil.com")).toBe("/new");
    expect(safeNextPath("/\\evil.com")).toBe("/new");
  });
});
