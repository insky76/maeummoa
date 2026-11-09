export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="9" cy="10" r="6" fill="#C2375A" />
      <circle cx="17" cy="10" r="6" fill="#F08A9E" />
      <circle cx="13" cy="17" r="6" fill="#F6C94C" opacity="0.9" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <Logo />
      <span className="font-display text-xl font-bold tracking-tight">마음모아</span>
    </span>
  );
}
