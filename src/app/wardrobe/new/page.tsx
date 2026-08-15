"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, AlertCircle, Check, X, Plus } from "lucide-react";
import { CATEGORIES, PATTERNS, SEASONS } from "@/lib/db/schema";
import { downscaleImage } from "@/lib/image";

type Details = {
  name: string;
  category: string;
  subcategory: string;
  colors: { name: string; hex: string }[];
  pattern: string;
  formality: number;
  seasons: string[];
};

const EMPTY: Details = {
  name: "",
  category: "top",
  subcategory: "",
  colors: [{ name: "", hex: "#888888" }],
  pattern: "solid",
  formality: 3,
  seasons: [],
};

export default function NewGarmentPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [details, setDetails] = useState<Details>(EMPTY);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(chosen: File | null) {
    setAnalyzed(false);
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    if (!chosen) {
      setFile(null);
      setPreview(null);
      return;
    }

    setAnalyzing(true);
    // Shrink phone photos so they fit the upload limit before anything else.
    const f = await downscaleImage(chosen);
    setFile(f);
    setPreview(URL.createObjectURL(f));

    const form = new FormData();
    form.append("image", f);
    const res = await fetch("/api/analyze", { method: "POST", body: form });
    setAnalyzing(false);
    if (res.ok) {
      const data = await res.json();
      setDetails({
        name: data.name ?? "",
        category: data.category ?? "top",
        subcategory: data.subcategory ?? "",
        colors: data.colors?.length ? data.colors : EMPTY.colors,
        pattern: data.pattern ?? "solid",
        formality: data.formality ?? 3,
        seasons: data.seasons ?? [],
      });
      setAnalyzed(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Analysis failed — fill in the details manually.");
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a photo first.");
      return;
    }
    setSaving(true);
    setError(null);
    const form = new FormData();
    form.append("image", file);
    form.append(
      "details",
      JSON.stringify({
        ...details,
        // Keep every color that has a usable hex — matching scores on the hex,
        // so an unnamed color is still worth storing.
        colors: details.colors
          .filter((c) => /^#[0-9a-fA-F]{6}$/.test(c.hex))
          .map((c) => ({ hex: c.hex, name: c.name.trim() || "this color" })),
      })
    );

    let res: Response;
    try {
      res = await fetch("/api/garments", { method: "POST", body: form });
    } catch {
      setSaving(false);
      setError("Could not reach the server. Check your connection and retry.");
      return;
    }
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? `Saving failed (HTTP ${res.status}).`);
      return;
    }
    const item = await res.json();
    router.push(`/wardrobe/${item.id}`);
    router.refresh();
  }

  function setColor(i: number, patch: Partial<{ name: string; hex: string }>) {
    setDetails((d) => ({
      ...d,
      colors: d.colors.map((c, j) => (j === i ? { ...c, ...patch } : c)),
    }));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="label-caps text-ink-faint">Add to wardrobe</p>
      <h1 className="mt-1 text-[2.25rem] font-bold leading-tight tracking-tight">
        Photograph a garment
      </h1>
      <p className="mt-2 text-ink-muted">
        The details are detected from the photo. Adjust anything that looks
        wrong before saving.
      </p>

      <form onSubmit={onSave} className="mt-8 space-y-7">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="card flex w-full flex-col items-center justify-center border-dashed p-8 text-center transition-colors hover:border-accent"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Selected garment"
              className="max-h-72 rounded-card object-contain"
            />
          ) : (
            <>
              <span className="flex h-14 w-14 items-center justify-center rounded-card bg-accent-soft text-accent">
                <Camera className="h-7 w-7" aria-hidden="true" />
              </span>
              <span className="mt-4 font-medium">Choose a photo</span>
              <span className="mt-1 text-sm text-ink-faint">
                JPEG, PNG or WebP — large photos are resized automatically
              </span>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
        </button>

        {analyzing && (
          <div className="space-y-2" aria-live="polite">
            <p className="text-sm text-ink-muted">Reading the photo…</p>
            <div className="shimmer h-2 w-full rounded-full" />
            <div className="shimmer h-2 w-2/3 rounded-full" />
          </div>
        )}

        {analyzed && (
          <p className="flex items-center gap-2 text-sm text-success">
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            Details detected — review them below.
          </p>
        )}

        {error && (
          <p className="flex items-start gap-2 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="field-label">
              Name
            </label>
            <input
              id="name"
              required
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
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
              onChange={(e) =>
                setDetails({ ...details, category: e.target.value })
              }
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
              onChange={(e) =>
                setDetails({ ...details, subcategory: e.target.value })
              }
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
              onChange={(e) =>
                setDetails({ ...details, pattern: e.target.value })
              }
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
              onChange={(e) =>
                setDetails({ ...details, formality: Number(e.target.value) })
              }
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
                      setDetails((d) => ({
                        ...d,
                        colors: d.colors.filter((_, j) => j !== i),
                      }))
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
                  setDetails((d) => ({
                    ...d,
                    colors: [...d.colors, { name: "", hex: "#888888" }],
                  }))
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
                    setDetails((d) => ({
                      ...d,
                      seasons: active
                        ? d.seasons.filter((x) => x !== s)
                        : [...d.seasons, s],
                    }))
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

        <button
          disabled={saving || analyzing}
          className="btn btn-primary w-full"
        >
          {saving ? "Saving…" : "Save to wardrobe"}
        </button>
      </form>
    </div>
  );
}
