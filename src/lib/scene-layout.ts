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
  /** 꽃다발: 꽃이 모인 타원 (잎·안개꽃 장식 위치) */
  cluster?: { cx: number; cy: number; rx: number; ry: number; size: number };
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

  // 꽃이 적을수록 크게, 서로 살짝 겹치도록 붙여서 포장지 위에 둥근 다발로 모은다
  const size =
    n <= 1 ? 120 : n <= 3 ? 104 : n <= 6 ? 94 : n <= 10 ? 86 : n <= 16 ? 80 : n <= 25 ? 72 : n <= 35 ? 66 : 60;
  // 꽃 하나가 차지하는 넓이(서로 겹치게 0.66배)로 다발 타원 크기를 정한다
  const area = n * (size * 0.66) ** 2;
  const ry = clamp(Math.sqrt(area / (Math.PI * 1.25)), 0, 135);
  const rx = clamp(ry * 1.25, 0, 165);
  const cx = SCENE_W / 2;
  // 다발 아랫부분이 포장지 윗선(y=262)에 걸치도록
  const cy = 262 - ry * 0.55 - size * 0.15;
  const items: Placed[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : Math.sqrt((i + 0.5) / n);
    const a = i * GOLDEN + rnd() * 0.35;
    items.push({
      x: clamp(cx + t * rx * Math.cos(a), size / 2 + 4, SCENE_W - size / 2 - 4),
      y: clamp(cy + t * ry * Math.sin(a), size / 2 + 8, 310),
      size: size * (0.92 + rnd() * 0.16),
    });
  }
  // 꽃이 적으면 나선 배치가 한쪽으로 쏠리므로, 무게중심을 다발 가운데로 옮긴다
  if (n > 1) {
    const mx = items.reduce((a, p) => a + p.x, 0) / n;
    const my = items.reduce((a, p) => a + p.y, 0) / n;
    for (const p of items) {
      p.x = clamp(p.x + (cx - mx), p.size / 2 + 4, SCENE_W - p.size / 2 - 4);
      p.y = clamp(p.y + (cy - 10 - my), p.size / 2 + 8, 300);
    }
  }
  // 아래쪽 꽃이 앞에 오도록
  items.sort((p, q) => p.y - q.y);
  return { height: 470, items, expanded: false, cluster: { cx, cy: cy - 10, rx: Math.max(rx, size * 0.45), ry: Math.max(ry, size * 0.4), size } };
}

/** 밤하늘: 서로 너무 붙지 않게 흩뿌린 별 + 가까운 별끼리 별자리 선. 많으면 대각선 은하수. */
export function starLayout(lengths: number[], seed: string, expandAt: number): SceneLayout {
  const rnd = seededRandom(seed);
  const n = lengths.length;
  const sizeOf = (len: number, base: number) => base + Math.min(len, 120) / 120 * 16;

  if (n >= expandAt) {
    // 은하수: 화면 전체 폭을 쓰도록 5열 격자에 흩뿌리고, 은하수 띠는 배경에서 S자로 흐르게 한다
    const cols = 5;
    const cell = SCENE_W / cols;
    const rows = Math.ceil(n / cols);
    const rowH = 58;
    const height = 60 + rows * rowH + 60;
    const items: Placed[] = [];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      items.push({
        x: clamp(c * cell + cell / 2 + (rnd() - 0.5) * cell * 0.7, 18, SCENE_W - 18),
        y: 60 + r * rowH + rowH / 2 + (rnd() - 0.5) * rowH * 0.7,
        size: sizeOf(lengths[i], 22),
      });
    }
    // 가까운 별 몇 개만 이어 작은 별자리처럼
    const links: [number, number][] = [];
    for (let i = 1; i < n; i++) {
      if (rnd() > 0.35) continue;
      let j = -1;
      let d = Infinity;
      for (let k = Math.max(0, i - cols - 1); k < i; k++) {
        const dk = Math.hypot(items[i].x - items[k].x, items[i].y - items[k].y);
        if (dk < d) {
          d = dk;
          j = k;
        }
      }
      if (j >= 0 && d < 95) links.push([j, i]);
    }
    return { height, items, expanded: true, links };
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

/** 은하수 띠의 중심선 (S자로 흐름). SVG path 문자열 */
export function milkyWayPath(height: number, seed: string): string {
  const rnd = seededRandom(`${seed}:milky`);
  const phase = rnd() * Math.PI * 2;
  const period = 300 + rnd() * 140;
  const pts: string[] = [];
  for (let y = -20; y <= height + 20; y += 20) {
    const x = SCENE_W / 2 + Math.sin(y / period + phase) * SCENE_W * 0.28;
    pts.push(`${pts.length ? "L" : "M"}${x.toFixed(1)} ${y}`);
  }
  return pts.join(" ");
}

/** 꽃다발 둘레 장식: 잎과 안개꽃. 꽃 개수와 상관없이 다발이 풍성해 보이게 */
export function bouquetGreenery(c: NonNullable<SceneLayout["cluster"]>, n: number, seed: string) {
  const rnd = seededRandom(`${seed}:green`);
  const leafCount = clamp(Math.round(6 + n * 0.5), 6, 16);
  const leaves = Array.from({ length: leafCount }, (_, i) => {
    // 왼쪽 옆 → 위 → 오른쪽 옆 (165° ~ 375°)
    const deg = 165 + (210 * (i + 0.5)) / leafCount + (rnd() - 0.5) * 14;
    const a = (deg * Math.PI) / 180;
    const r = 0.92 + rnd() * 0.18;
    const len = c.size * (0.42 + rnd() * 0.18);
    return {
      // 화면 밖으로 잘리지 않게
      x: clamp(c.cx + Math.cos(a) * (c.rx + c.size * 0.18) * r, len / 2 + 2, SCENE_W - len / 2 - 2),
      y: c.cy + Math.sin(a) * (c.ry + c.size * 0.18) * r,
      angle: deg,
      len,
      dark: rnd() < 0.45,
    };
  });
  const dotCount = clamp(Math.round(14 + n * 0.8), 14, 44);
  const dots = Array.from({ length: dotCount }, () => {
    const deg = 160 + rnd() * 220;
    const a = (deg * Math.PI) / 180;
    const r = 0.8 + rnd() * 0.42;
    return {
      x: c.cx + Math.cos(a) * (c.rx + c.size * 0.1) * r,
      y: c.cy + Math.sin(a) * (c.ry + c.size * 0.1) * r,
      r: 2 + rnd() * 1.6,
    };
  });
  return { leaves, dots };
}
