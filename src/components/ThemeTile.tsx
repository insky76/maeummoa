import type { ThemeKey } from "@/lib/domain";

/** 홈·보드 만들기에서 쓰는 테마 미리보기 그림 */
export function ThemeTile({ theme }: { theme: Extract<ThemeKey, "flower" | "star" | "note"> }) {
  if (theme === "flower") {
    return (
      <div className="flex h-[132px] items-center justify-center rounded-2xl bg-brand-soft">
        <svg width="84" height="96" viewBox="0 0 84 96" aria-hidden="true">
          <line x1="26" y1="34" x2="42" y2="88" stroke="#5E9B5A" strokeWidth="2" />
          <line x1="58" y1="34" x2="42" y2="88" stroke="#5E9B5A" strokeWidth="2" />
          <line x1="42" y1="22" x2="42" y2="88" stroke="#5E9B5A" strokeWidth="2" />
          <Flower x={26} y={34} r={7} color="#E25C7A" center="#F6C94C" />
          <Flower x={58} y={34} r={7} color="#8C8FE6" center="#FFFFFF" />
          <Flower x={42} y={20} r={7} color="#F2A03D" center="#7A3B12" />
          <polygon points="22,60 62,60 48,94 36,94" fill="#F3D2C1" />
        </svg>
      </div>
    );
  }
  if (theme === "star") {
    const star = "M0,-8 L2,-2 L8,0 L2,2 L0,8 L-2,2 L-8,0 L-2,-2Z";
    return (
      <div className="flex h-[132px] items-center justify-center rounded-2xl bg-night">
        <svg width="90" height="100" viewBox="0 0 90 100" aria-hidden="true">
          <g stroke="#FFF3C4" strokeOpacity="0.35" strokeWidth="1">
            <line x1="20" y1="30" x2="46" y2="20" />
            <line x1="46" y1="20" x2="68" y2="44" />
            <line x1="68" y1="44" x2="40" y2="70" />
          </g>
          <path transform="translate(20 30)" d={star} fill="#FFF3C4" />
          <path transform="translate(46 20) scale(1.3)" d={star} fill="#FFF3C4" />
          <path transform="translate(68 44)" d={star} fill="#FFE08A" />
          <path transform="translate(40 70) scale(1.1)" d={star} fill="#FFF3C4" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex h-[132px] items-center justify-center rounded-2xl bg-cork">
      <svg width="90" height="100" viewBox="0 0 90 100" aria-hidden="true">
        <rect x="8" y="10" width="36" height="36" rx="2" fill="#FFE58A" transform="rotate(-6 26 28)" />
        <rect x="48" y="14" width="36" height="36" rx="2" fill="#FFC4D0" transform="rotate(5 66 32)" />
        <rect x="12" y="54" width="36" height="36" rx="2" fill="#BDEBD3" transform="rotate(4 30 72)" />
        <rect x="50" y="56" width="36" height="36" rx="2" fill="#C6DBFF" transform="rotate(-4 68 74)" />
      </svg>
    </div>
  );
}

/** 다섯 장 꽃잎 꽃. 꽃 테마 전반에서 재사용한다. */
export function Flower({ x, y, r, color, center }: { x: number; y: number; r: number; color: string; center: string }) {
  const d = r; // 꽃잎 중심까지 거리
  const petals = [0, 72, 144, 216, 288].map((deg) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [Math.cos(rad) * d, Math.sin(rad) * d] as const;
  });
  return (
    <g transform={`translate(${x} ${y})`}>
      {petals.map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r={r} fill={color} />
      ))}
      <circle cx={0} cy={0} r={r * 0.57} fill={center} />
    </g>
  );
}
