import type { Category, Garment, GarmentColor } from "./db/schema";

export type ScoredMatch = {
  garment: Garment;
  score: number;
  reasons: string[];
};

/** Which categories are worth recommending alongside a given category. */
const COMPLEMENTS: Record<Category, Category[]> = {
  top: ["bottom", "shoes", "outerwear", "accessory"],
  bottom: ["top", "shoes", "outerwear", "accessory"],
  dress: ["shoes", "outerwear", "accessory"],
  outerwear: ["top", "bottom", "dress", "shoes"],
  shoes: ["top", "bottom", "dress", "outerwear"],
  accessory: ["top", "bottom", "dress"],
};

type Hsl = { h: number; s: number; l: number };

function hexToHsl(hex: string): Hsl | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      break;
    case g:
      h = ((b - r) / d + 2) * 60;
      break;
    default:
      h = ((r - g) / d + 4) * 60;
  }
  return { h, s, l };
}

/** Neutrals (black, white, grey, navy, beige, denim) go with everything. */
function isNeutral(c: Hsl): boolean {
  if (c.s < 0.18) return true; // greys, black, white
  if (c.l < 0.12 || c.l > 0.94) return true; // near-black / near-white
  if (c.h >= 200 && c.h <= 250 && c.l < 0.35) return true; // navy
  if (c.h >= 200 && c.h <= 235 && c.s < 0.55) return true; // washed denim blue
  if (c.h >= 25 && c.h <= 55 && c.s < 0.45 && c.l > 0.55) return true; // beige/khaki
  return false;
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** Score how well two individual colors work together (delta on a base score). */
function colorPairScore(
  a: { hsl: Hsl; name: string },
  b: { hsl: Hsl; name: string }
): { delta: number; reason: string | null } {
  const aN = isNeutral(a.hsl);
  const bN = isNeutral(b.hsl);
  if (aN && bN) {
    return { delta: 22, reason: `${cap(a.name)} and ${b.name} are both neutrals — a safe, classic pairing` };
  }
  if (aN || bN) {
    const neutral = aN ? a.name : b.name;
    const color = aN ? b.name : a.name;
    return { delta: 26, reason: `${cap(neutral)} is a neutral and pairs easily with ${color}` };
  }
  const dist = hueDistance(a.hsl.h, b.hsl.h);
  if (dist <= 25) {
    return { delta: 20, reason: `${cap(a.name)} and ${b.name} are tone-on-tone (analogous hues)` };
  }
  if (dist >= 150) {
    return { delta: 18, reason: `${cap(a.name)} and ${b.name} are complementary colors — a deliberate contrast` };
  }
  if (dist >= 100) {
    return { delta: 8, reason: `${cap(a.name)} and ${b.name} form a bold triadic combination` };
  }
  // 25–100° apart with both colors saturated tends to clash
  if (a.hsl.s > 0.45 && b.hsl.s > 0.45) {
    return { delta: -18, reason: `${cap(a.name)} and ${b.name} sit awkwardly close on the color wheel and may clash` };
  }
  return { delta: 0, reason: null };
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function parsedColors(g: Garment): { hsl: Hsl; name: string }[] {
  return (g.colors as GarmentColor[])
    .map((c) => ({ hsl: hexToHsl(c.hex), name: c.name }))
    .filter((c): c is { hsl: Hsl; name: string } => c.hsl !== null);
}

/**
 * Score a candidate garment against a base garment. Returns 0–100 plus
 * human-readable reasons. Considers color harmony, formality and seasons.
 */
export function scoreMatch(base: Garment, candidate: Garment): ScoredMatch {
  let score = 50;
  const reasons: string[] = [];

  const baseColors = parsedColors(base);
  const candColors = parsedColors(candidate);

  // Best color pairing between the two garments drives the color score.
  let best: { delta: number; reason: string | null } = { delta: 0, reason: null };
  for (const a of baseColors) {
    for (const b of candColors) {
      const r = colorPairScore(a, b);
      if (r.delta > best.delta) best = r;
    }
  }
  // Also apply the single worst clash so loud combinations get penalized.
  let worst = 0;
  let worstReason: string | null = null;
  for (const a of baseColors) {
    for (const b of candColors) {
      const r = colorPairScore(a, b);
      if (r.delta < worst) {
        worst = r.delta;
        worstReason = r.reason;
      }
    }
  }
  score += best.delta + worst;
  if (best.reason) reasons.push(best.reason);
  if (worstReason) reasons.push(worstReason);

  // Pattern mixing: two busy patterns compete with each other.
  if (base.pattern !== "solid" && candidate.pattern !== "solid") {
    score -= 12;
    reasons.push("Both pieces are patterned — mixing patterns is a bold choice");
  }

  // Formality alignment.
  const fDiff = Math.abs(base.formality - candidate.formality);
  if (fDiff <= 1) {
    score += 8;
    reasons.push("Similar formality level");
  } else {
    score -= 8 * (fDiff - 1);
    reasons.push("Noticeably different formality levels");
  }

  // Season overlap.
  const shared = (base.seasons as string[]).filter((s) =>
    (candidate.seasons as string[]).includes(s)
  );
  if (shared.length > 0) {
    score += 6;
    reasons.push(`Both work in ${shared.join(", ")}`);
  } else if (base.seasons.length > 0 && candidate.seasons.length > 0) {
    score -= 10;
    reasons.push("No overlapping seasons");
  }

  return {
    garment: candidate,
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons,
  };
}

/**
 * Given a base garment and the full wardrobe, return complementary items
 * sorted by match score (best first), grouped implicitly by score.
 */
export function findMatches(base: Garment, wardrobe: Garment[]): ScoredMatch[] {
  const wanted = COMPLEMENTS[base.category as Category] ?? [];
  return wardrobe
    .filter((g) => g.id !== base.id && wanted.includes(g.category as Category))
    .map((g) => scoreMatch(base, g))
    .sort((a, b) => b.score - a.score);
}
