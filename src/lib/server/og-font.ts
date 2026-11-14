import "server-only";

/**
 * 이미지(카카오톡 미리보기, 이미지 저장)에 쓸 한글 폰트.
 * 한글 폰트 전체는 너무 커서, Google Fonts 의 text= 기능으로 필요한 글자만 받아 온다.
 * 글자가 많으면 여러 조각으로 나눠 받고, 같은 이름으로 넘겨 빠진 글자를 다음 조각에서 찾게 한다.
 */
export interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
}

const CHUNK = 180; // URL 길이 제한을 넘지 않을 만큼
const cache = new Map<string, ArrayBuffer>();

async function fetchSubset(family: string, chars: string): Promise<ArrayBuffer | null> {
  const key = `${family}:${chars}`;
  const hit = cache.get(key);
  if (hit) return hit;
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&text=${encodeURIComponent(chars)}`;
    const css = await (await fetch(cssUrl, { signal: AbortSignal.timeout(5000) })).text();
    const src = css.match(/src:\s*url\(([^)]+)\)\s*format\('(opentype|truetype|woff)'\)/)?.[1];
    if (!src) return null;
    const res = await fetch(src, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    if (cache.size > 200) cache.clear();
    cache.set(key, buf);
    return buf;
  } catch (e) {
    console.error("og font fetch failed", e);
    return null;
  }
}

export async function loadOgFonts(text: string, family = "Gowun Dodum"): Promise<OgFont[]> {
  const chars = [...new Set([...text.replace(/\s/g, ""), ..."0123456789마음모아"])].sort().join("");
  const chunks: string[] = [];
  for (let i = 0; i < chars.length; i += CHUNK) chunks.push(chars.slice(i, i + CHUNK));
  const datas = await Promise.all(chunks.map((c) => fetchSubset(family, c)));
  return datas
    .filter((d): d is ArrayBuffer => !!d)
    .map((data, i) => ({ name: `MM${i}`, data, weight: 400 as const, style: "normal" as const }));
}

/** 조각 폰트 이름들을 CSS fontFamily 대체 목록으로 */
export function ogFontFamily(fonts: OgFont[]): string {
  return fonts.map((f) => f.name).join(", ") || "sans-serif";
}
