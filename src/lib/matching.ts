import type { Category, Garment, GarmentColor } from "./db/schema";

export type MatchComponent = {
  key: "color" | "contrast" | "intensity" | "formality" | "season" | "pattern";
  label: string;
  /** Quality of this dimension, 0–1. */
  value: number;
  /** How many points of the final 100 this dimension can contribute. */
  weight: number;
  note: string;
};

export type ScoredMatch = {
  garment: Garment;
  score: number;
  reasons: string[];
  components: MatchComponent[];
  /** Paired by hand, which outranks the score. */
  favorite: boolean;
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

/**
 * Piecewise-linear interpolation through anchor points. Scoring with smooth
 * curves rather than if/else buckets is what produces a spread of scores
 * instead of every pair landing on the same handful of values.
 */
function curve(x: number, points: [number, number][]): number {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return points[points.length - 1][1];
}

/** Neutrals (black, white, grey, navy, beige, denim) go with everything. */
function isNeutral(c: Hsl): boolean {
  if (c.s < 0.18) return true;
  if (c.l < 0.12 || c.l > 0.94) return true;
  if (c.h >= 200 && c.h <= 250 && c.l < 0.35) return true; // navy
  if (c.h >= 200 && c.h <= 235 && c.s < 0.55) return true; // washed denim
  if (c.h >= 25 && c.h <= 55 && c.s < 0.45 && c.l > 0.55) return true; // beige/khaki
  return false;
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * How well two colors relate on the color wheel. Pairings involving a neutral
 * are deliberately *not* top-scoring: they're safe, but a considered color
 * relationship is what makes an outfit look chosen rather than defaulted.
 */
function colorHarmony(
  a: { hsl: Hsl; name: string },
  b: { hsl: Hsl; name: string }
): { value: number; note: string } {
  const aN = isNeutral(a.hsl);
  const bN = isNeutral(b.hsl);

  if (aN && bN) {
    return {
      value: 0.44,
      note: `${cap(a.name)} and ${b.name} are both neutrals — safe, but no color interest`,
    };
  }

  if (aN || bN) {
    const neutral = aN ? a : b;
    const color = aN ? b : a;
    // A rich color against a neutral is the classic reliable pairing; a washed
    // out color against a neutral is duller.
    const value = curve(color.hsl.s, [
      [0, 0.48],
      [0.35, 0.66],
      [0.7, 0.82],
      [1, 0.78],
    ]);
    return {
      value,
      note: `${cap(neutral.name)} is a neutral that lets the ${color.name} lead`,
    };
  }

  const d = hueDistance(a.hsl.h, b.hsl.h);
  let value = curve(d, [
    [0, 0.72], // monochrome / tone-on-tone
    [22, 0.86], // analogous — reliably elegant
    [50, 0.2], // the awkward zone: neither harmony nor contrast
    [75, 0.14],
    [110, 0.42],
    [130, 0.72], // triadic
    [155, 0.94], // split complementary
    [180, 1], // complementary — the strongest deliberate contrast
  ]);

  // Muted colors are forgiving: the clash zone only really bites when both
  // colors are vivid.
  if (value < 0.6) {
    const forgiveness = 1 - Math.min(a.hsl.s, b.hsl.s);
    value = value + (0.6 - value) * forgiveness * 0.8;
  }

  let note: string;
  if (d <= 22) note = `${cap(a.name)} and ${b.name} are tone-on-tone`;
  else if (d >= 155) note = `${cap(a.name)} and ${b.name} are complementary — deliberate contrast`;
  else if (d >= 130) note = `${cap(a.name)} and ${b.name} form a split-complementary pair`;
  else if (d >= 110) note = `${cap(a.name)} and ${b.name} are a triadic combination`;
  else note = `${cap(a.name)} and ${b.name} sit awkwardly close on the color wheel`;

  return { value, note };
}

/** Light/dark separation. Two items of the same value read as a flat block. */
function valueContrast(a: Hsl, b: Hsl): { value: number; note: string } {
  const d = Math.abs(a.l - b.l);
  const value = curve(d, [
    [0, 0.1],
    [0.1, 0.28],
    [0.25, 0.62],
    [0.4, 0.88],
    [0.55, 1],
    [0.75, 0.94],
    [1, 0.8],
  ]);
  const note =
    d < 0.14
      ? "Both are a similar lightness, so the outfit reads as one flat block"
      : d > 0.62
        ? "Strong light-against-dark contrast"
        : "Comfortable light/dark separation";
  return { value, note };
}

/** Two vivid colors fight for attention; one loud plus one quiet is ideal. */
function intensityBalance(a: Hsl, b: Hsl): { value: number; note: string } {
  const hi = Math.max(a.s, b.s);
  const lo = Math.min(a.s, b.s);
  const value = curve(hi * lo, [
    [0, 0.72],
    [0.15, 0.95],
    [0.3, 0.7],
    [0.55, 0.28],
    [1, 0.1],
  ]);
  const note =
    hi > 0.6 && lo > 0.6
      ? "Two saturated colors compete for attention"
      : hi > 0.55
        ? "One bold piece against a quieter one — well balanced"
        : "Both are muted, so nothing fights for attention";
  return { value, note };
}

function formalityFit(a: number, b: number): { value: number; note: string } {
  const d = Math.abs(a - b);
  const value = curve(d, [
    [0, 1],
    [1, 0.74],
    [2, 0.42],
    [3, 0.1],
    [4, 0],
  ]);
  const note =
    d === 0
      ? "Exactly the same formality level"
      : d === 1
        ? "Close enough in formality"
        : d === 2
          ? "Noticeably different formality levels"
          : "Very different formality — one is far dressier than the other";
  return { value, note };
}

function seasonFit(
  a: string[],
  b: string[]
): { value: number; note: string; shared: string[] } {
  if (a.length === 0 || b.length === 0) {
    return { value: 0.6, note: "No season set on one of these", shared: [] };
  }
  const shared = a.filter((s) => b.includes(s));
  // Coverage of the more restrictive item, not overlap of the union: an
  // all-season shirt fully covers summer-only shorts, so it should not be
  // penalised for also being wearable in winter.
  const coverage = shared.length / Math.min(a.length, b.length);
  const value = curve(coverage, [
    [0, 0.04],
    [0.34, 0.5],
    [0.67, 0.82],
    [1, 1],
  ]);
  const note =
    shared.length === 0
      ? "No overlapping seasons — you would not wear these at the same time of year"
      : `Both work in ${shared.join(", ")}`;
  return { value, note, shared };
}

function patternFit(a: string, b: string): { value: number; note: string } {
  const aSolid = a === "solid";
  const bSolid = b === "solid";
  if (aSolid && bSolid) {
    return { value: 0.68, note: "Two solids — clean, if unadventurous" };
  }
  if (aSolid || bSolid) {
    return { value: 1, note: "A pattern against a solid — nicely balanced" };
  }
  return {
    value: a === b ? 0.08 : 0.18,
    note: "Two patterns compete with each other",
  };
}

function parsedColors(g: Garment): { hsl: Hsl; name: string }[] {
  return (g.colors as GarmentColor[])
    .map((c) => ({ hsl: hexToHsl(c.hex), name: c.name }))
    .filter((c): c is { hsl: Hsl; name: string } => c.hsl !== null);
}

const FALLBACK: Hsl = { h: 0, s: 0, l: 0.5 };

/**
 * Score a candidate garment against a base garment across six weighted
 * dimensions. Returns 0–100 plus the per-dimension breakdown.
 */
export function scoreMatch(base: Garment, candidate: Garment): ScoredMatch {
  const baseColors = parsedColors(base);
  const candColors = parsedColors(candidate);

  // Color harmony uses the best available pairing between the two garments;
  // the other color dimensions use each garment's dominant color.
  let harmony = { value: 0.55, note: "No colors recorded for these items" };
  for (const a of baseColors) {
    for (const b of candColors) {
      const h = colorHarmony(a, b);
      if (h.value > harmony.value || harmony.note.startsWith("No colors")) {
        harmony = h;
      }
    }
  }

  const aMain = baseColors[0]?.hsl ?? FALLBACK;
  const bMain = candColors[0]?.hsl ?? FALLBACK;
  const contrast = valueContrast(aMain, bMain);
  const intensity = intensityBalance(aMain, bMain);
  const formality = formalityFit(base.formality, candidate.formality);
  const season = seasonFit(base.seasons as string[], candidate.seasons as string[]);
  const pattern = patternFit(base.pattern, candidate.pattern);

  const components: MatchComponent[] = [
    { key: "color", label: "Color harmony", weight: 32, ...harmony },
    { key: "contrast", label: "Light/dark contrast", weight: 17, ...contrast },
    { key: "intensity", label: "Intensity balance", weight: 11, ...intensity },
    { key: "formality", label: "Formality", weight: 21, ...formality },
    { key: "season", label: "Season", weight: 11, ...season },
    { key: "pattern", label: "Pattern", weight: 8, ...pattern },
  ];

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const quality =
    components.reduce((sum, c) => sum + c.value * c.weight, 0) / totalWeight;

  // Formality and season behave as gates rather than as slices: a t-shirt does
  // not go with suit trousers no matter how well the colors work, so a failure
  // there has to drag the whole score down instead of costing its own weight.
  const gate =
    (0.55 + 0.45 * formality.value) * (0.7 + 0.3 * season.value);

  // Spread the usable band. Without this, six averaged dimensions pull almost
  // every pair toward the middle and nothing is distinguishable.
  const score = Math.round(
    100 *
      curve(quality * gate, [
        [0, 0],
        [0.25, 0.06],
        [0.4, 0.24],
        [0.52, 0.45],
        [0.62, 0.64],
        [0.72, 0.79],
        [0.82, 0.91],
        [1, 1],
      ])
  );

  // Explain the ranking: the two dimensions carrying it, plus the one holding
  // it back (if any is genuinely weak).
  const byContribution = [...components].sort(
    (x, y) => y.value * y.weight - x.value * x.weight
  );
  const reasons = byContribution.slice(0, 2).map((c) => c.note);
  const weakest = [...components].sort((x, y) => x.value - y.value)[0];
  if (weakest.value < 0.5 && !reasons.includes(weakest.note)) {
    reasons.push(weakest.note);
  }

  return { garment: candidate, score, reasons, components, favorite: false };
}

/**
 * Given a base garment and the full wardrobe, return complementary items
 * sorted by match score, best first. Garments in the laundry are left out —
 * they are not available to wear.
 */
export function findMatches(
  base: Garment,
  wardrobe: Garment[],
  favoriteIds: ReadonlySet<string> = new Set()
): ScoredMatch[] {
  const wanted = COMPLEMENTS[base.category as Category] ?? [];
  return wardrobe
    .filter(
      (g) =>
        g.id !== base.id &&
        !g.isDirty &&
        wanted.includes(g.category as Category)
    )
    .map((g) => ({ ...scoreMatch(base, g), favorite: favoriteIds.has(g.id) }))
    .sort((a, b) => {
      // Hand-picked pairings come first whatever they scored; within each
      // band the better score wins.
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      return b.score - a.score;
    });
}

/** How many otherwise-matching garments are unavailable because of laundry. */
export function countDirtyCandidates(
  base: Garment,
  wardrobe: Garment[]
): number {
  const wanted = COMPLEMENTS[base.category as Category] ?? [];
  return wardrobe.filter(
    (g) =>
      g.id !== base.id && g.isDirty && wanted.includes(g.category as Category)
  ).length;
}

/** Group ranked matches by category, preserving the score order within each. */
export function groupByCategory(
  matches: ScoredMatch[]
): { category: string; matches: ScoredMatch[] }[] {
  const order: Category[] = [
    "top",
    "bottom",
    "dress",
    "outerwear",
    "shoes",
    "accessory",
  ];
  const groups = new Map<string, ScoredMatch[]>();
  for (const m of matches) {
    const list = groups.get(m.garment.category) ?? [];
    list.push(m);
    groups.set(m.garment.category, list);
  }
  return order
    .filter((c) => groups.has(c))
    .map((c) => ({ category: c, matches: groups.get(c)! }));
}
