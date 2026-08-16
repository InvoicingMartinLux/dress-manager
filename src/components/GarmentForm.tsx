"use client";

import { X, Plus } from "lucide-react";
import { CATEGORIES, PATTERNS, SEASONS } from "@/lib/db/schema";

export type GarmentDetails = {
  name: string;
  category: string;
  subcategory: string;
  colors: { name: string; hex: string }[];
  pattern: string;
  formality: number;
  seasons: string[];
};

export const EMPTY_DETAILS: GarmentDetails = {
  name: "",
  category: "top",
  subcategory: "",
  colors: [{ name: "", hex: "#888888" }],
  pattern: "solid",
  formality: 3,
  seasons: [],
};

/** Drop colors with an unusable hex; an unnamed color is still worth keeping,
 *  because matching scores on the hex rather than the name. */
export function cleanColors(colors: GarmentDetails["colors"]) {
  return colors
    .filter((c) => /^#[0-9a-fA-F]{6}$/.test(c.hex))
    .map((c) => ({ hex: c.hex, name: c.name.trim() || "this color" }));
}

/**
 * The attribute fields shared by adding and editing a garment. The caller owns
 * the state, the surrounding form element and the submit button.
 */
export default function GarmentFields({
  details,
  setDetails,
  disabled,
}: {
  details: GarmentDetails;
  setDetails: (next: GarmentDetails) => void;
  disabled?: boolean;
}) {
  function patch(next: Partial<GarmentDetails>) {
    setDetails({ ...details, ...next });
  }

  function setColor(i: number, p: Partial<{ name: string; hex: string }>) {
    patch({
      colors: details.colors.map((c, j) => (j === i ? { ...c, ...p } : c)),
    });
  }

  return (
    <fieldset disabled={disabled} className="space-y-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="field-label">
            Name
          </label>
          <input
            id="name"
            required
            value={details.name}
            onChange={(e) => patch({ name: e.target.value })}
            className="field"
            placeholder="Light blue oxford shirt"
          />
        </div>

        <div>
          <label htmlFor="category" className="field-label">
            Category
          </label>
          <select
            id="category"
            value={details.category}
            onChange={(e) => patch({ category: e.target.value })}
            className="field capitalize"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subcategory" className="field-label">
            Subcategory
          </label>
          <input
            id="subcategory"
            value={details.subcategory}
            onChange={(e) => patch({ subcategory: e.target.value })}
            className="field"
            placeholder="jeans, t-shirt"
          />
        </div>

        <div>
          <label htmlFor="pattern" className="field-label">
            Pattern
          </label>
          <select
            id="pattern"
            value={details.pattern}
            onChange={(e) => patch({ pattern: e.target.value })}
            className="field capitalize"
          >
            {PATTERNS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="formality" className="field-label">
            Formality: {details.formality}{" "}
            <span className="font-normal text-ink-faint">
              (1 casual — 5 formal)
            </span>
          </label>
          <input
            id="formality"
            type="range"
            min={1}
            max={5}
            value={details.formality}
            onChange={(e) => patch({ formality: Number(e.target.value) })}
            className="mt-2 w-full accent-[var(--accent)]"
          />
        </div>
      </div>

      <div>
        <span className="field-label">Colors</span>
        <div className="space-y-2">
          {details.colors.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="color"
                aria-label={`Color ${i + 1}`}
                value={/^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#888888"}
                onChange={(e) => setColor(i, { hex: e.target.value })}
                className="h-10 w-12 shrink-0 cursor-pointer rounded-[4px] border border-line bg-surface p-1"
              />
              <input
                value={c.name}
                onChange={(e) => setColor(i, { name: e.target.value })}
                placeholder="Color name, e.g. navy blue"
                aria-label={`Color ${i + 1} name`}
                className="field"
              />
              {details.colors.length > 1 && (
                <button
                  type="button"
                  aria-label="Remove color"
                  onClick={() =>
                    patch({ colors: details.colors.filter((_, j) => j !== i) })
                  }
                  className="shrink-0 rounded-[4px] p-2 text-ink-faint transition-colors hover:text-danger"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          {details.colors.length < 3 && (
            <button
              type="button"
              onClick={() =>
                patch({
                  colors: [...details.colors, { name: "", hex: "#888888" }],
                })
              }
              className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add color
            </button>
          )}
        </div>
      </div>

      <div>
        <span className="field-label">Seasons</span>
        <div className="flex flex-wrap gap-2">
          {SEASONS.map((s) => {
            const active = details.seasons.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  patch({
                    seasons: active
                      ? details.seasons.filter((x) => x !== s)
                      : [...details.seasons, s],
                  })
                }
                className={`rounded-card border px-3.5 py-1.5 text-sm capitalize transition-colors ${
                  active
                    ? "border-accent bg-accent-soft font-medium text-accent"
                    : "border-line bg-surface text-ink-muted hover:text-ink"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}
