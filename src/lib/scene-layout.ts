/**
 * 선물 장면 배치. 같은 보드는 언제 열어도 같은 모습이 되도록 보드 id 로 시드를 정한 난수를 쓴다.
 * 좌표는 viewBox(가로 390) 기준이며, 화면에서는 % 로 바꿔 배치한다.
 */
export const SCENE_W = 390;

export function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Placed {
  x: number;
  y: number;
  size: number; // 지름
}

export interface SceneLayout {
  height: number;
  items: Placed[];
  expanded: boolean;
  /** 밤하늘 별자리 선 (items 인덱스 쌍) */
  links?: [number, number][];
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** 꽃다발: 포장지 위 둥근 다발. 많으면(expandAt 이상) 아래로 길어지는 꽃밭. */
export function flowerLayout(n: number, seed: string, expandAt: number): SceneLayout {
  const rnd = seededRandom(seed);
  if (n >= expandAt) {
    const cols = 6;
    const cell = SCENE_W / cols;
    const rows = Math.ceil(n / cols);
    const items: Placed[] = [];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const shift = r % 2 ? cell / 4 : -cell / 4; // 줄마다 살짝 어긋나게
      items.push({
        x: clamp(c * cell + cell / 2 + shift + (rnd() - 0.5) * 12, 24, SCENE_W - 24),
        y: 70 + r * 62 + (rnd() - 0.5) * 12,
        size: 44,
      });
    }
    return { height: 70 + rows * 62 + 60, items, expanded: true };
  }

  const size = n <= 3 ? 72 : n <= 8 ? 62 : n <= 16 ? 54 : n <= 30 ? 46 : 40;
  const radius = clamp(28 + Math.sqrt(n) * (size * 0.55), 40, 160);
  const cx = SCENE_W / 2;
  const cy = 190;
  const items: Placed[] = [];
  for (let i = 0; i < n; i++) {
    const r = n === 1 ? 0 : Math.sqrt((i + 0.5) / n) * radius;
    const a = i * GOLDEN + rnd() * 0.3;
    items.push({
      x: clamp(cx + r * Math.cos(a), size / 2 + 4, SCENE_W - size / 2 - 4),
      y: clamp(cy + r * Math.sin(a) * 0.82 - 10, size / 2 + 8, 300),
      size: size * (0.92 + rnd() * 0.16),
    });
  }
  // 아래쪽 꽃이 앞에 오도록
  items.sort((p, q) => p.y - q.y);
  return { height: 470, items, expanded: false };
}

/** 밤하늘: 서로 너무 붙지 않게 흩뿌린 별 + 가까운 별끼리 별자리 선. 많으면 대각선 은하수. */
export function starLayout(lengths: number[], seed: string, expandAt: number): SceneLayout {
  const rnd = seededRandom(seed);
  const n = lengths.length;
  const sizeOf = (len: number, base: number) => base + Math.min(len, 120) / 120 * 16;

  if (n >= expandAt) {
    const height = 520 + Math.ceil((n - expandAt) / 6) * 60;
    const items: Placed[] = [];
    for (let i = 0; i < n; i++) {
      const y = 40 + ((i + rnd()) / n) * (height - 80);
      // 은하수 띠: 왼쪽 아래 → 오른쪽 위로 흐르는 중심선 주변에 모인다
      const band = SCENE_W * 0.85 - (y / height) * SCENE_W * 0.7;
      const spread = (rnd() + rnd() + rnd() - 1.5) * 120;
      items.push({ x: clamp(band + spread, 20, SCENE_W - 20), y, size: sizeOf(lengths[i], 22) });
    }
    return { height, items, expanded: true };
  }

  const height = 470;
  const minDist = clamp(78 - n * 1.2, 40, 78);
  const items: Placed[] = [];
  for (let i = 0; i < n; i++) {
    let best: Placed | null = null;
    let bestScore = -1;
    for (let t = 0; t < 40; t++) {
      const p = { x: 30 + rnd() * (SCENE_W - 60), y: 30 + rnd() * (height - 90), size: sizeOf(lengths[i], n > 25 ? 26 : 32) };
      const d = items.reduce((m, q) => Math.min(m, Math.hypot(p.x - q.x, p.y - q.y)), Infinity);
      if (d >= minDist) {
        best = p;
        break;
      }
      if (d > bestScore) {
        bestScore = d;
        best = p;
      }
    }
    items.push(best!);
  }
  const links: [number, number][] = [];
  for (let i = 1; i < n; i++) {
    let j = -1;
    let d = Infinity;
    for (let k = 0; k < i; k++) {
      const dk = Math.hypot(items[i].x - items[k].x, items[i].y - items[k].y);
      if (dk < d) {
        d = dk;
        j = k;
      }
    }
    if (j >= 0 && d < 130) links.push([j, i]);
  }
  return { height, items, expanded: false, links };
}
