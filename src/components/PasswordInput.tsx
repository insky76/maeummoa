"use client";

/** 숫자 4자리 비밀번호 입력. 휴대폰에서 숫자 키패드가 뜨도록 inputMode 를 준다. */
export function PasswordInput({
  value,
  onChange,
  id,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      id={id}
      type="password"
      inputMode="numeric"
      autoComplete="off"
      pattern="\d{4}"
      maxLength={4}
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
      placeholder="숫자 4자리"
      className="h-[52px] rounded-xl border border-line px-4 text-lg tracking-[0.4em] outline-none placeholder:text-base placeholder:tracking-normal focus-visible:outline-2 focus-visible:outline-brand"
    />
  );
}
