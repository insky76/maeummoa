"use client";

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-line-soft py-4">
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-[15px] font-bold">{label}</span>
        <span className="text-[13px] leading-normal text-ink-sub">{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`flex h-8 w-[52px] shrink-0 rounded-full p-[3px] transition-colors ${
          checked ? "justify-end bg-brand" : "justify-start bg-[#C9C6D3]"
        }`}
      >
        <span className="block h-[26px] w-[26px] rounded-full bg-white shadow-sm" />
      </button>
    </div>
  );
}
