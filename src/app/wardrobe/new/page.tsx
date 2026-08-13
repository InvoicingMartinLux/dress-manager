"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
      setError("Please choose a photo first.");
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
      <h1 className="text-2xl font-bold">Add a garment</h1>
      <p className="mt-1 text-sm text-stone-600">
        Upload a photo — AI will detect the details, and you can adjust them
        before saving.
      </p>

      <form onSubmit={onSave} className="mt-6 space-y-6">
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 bg-white p-6 text-center hover:border-stone-400"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 rounded-md object-contain"
            />
          ) : (
            <>
              <span className="text-3xl">📸</span>
              <p className="mt-2 text-sm text-stone-600">
                Click to choose a photo (JPEG, PNG, WebP — max 8 MB)
              </p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
        </div>

        {analyzing && (
          <p className="animate-pulse text-sm text-stone-600">
            🔍 Analyzing your garment with AI…
          </p>
        )}
        {analyzed && (
          <p className="text-sm text-green-700">
            ✓ Analyzed! Review the details below and adjust if needed.
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Name</label>
            <input
              required
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
              placeholder="e.g. Light blue oxford shirt"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              value={details.category}
              onChange={(e) =>
                setDetails({ ...details, category: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 capitalize"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Subcategory</label>
            <input
              value={details.subcategory}
              onChange={(e) =>
                setDetails({ ...details, subcategory: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
              placeholder="e.g. jeans, t-shirt"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Pattern</label>
            <select
              value={details.pattern}
              onChange={(e) =>
                setDetails({ ...details, pattern: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 capitalize"
            >
              {PATTERNS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">
              Formality: {details.formality}{" "}
              <span className="text-xs text-stone-500">
                (1 = casual, 5 = formal)
              </span>
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={details.formality}
              onChange={(e) =>
                setDetails({ ...details, formality: Number(e.target.value) })
              }
              className="mt-2 w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Colors</label>
          <div className="mt-2 space-y-2">
            {details.colors.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#888888"}
                  onChange={(e) => setColor(i, { hex: e.target.value })}
                  className="h-9 w-12 cursor-pointer rounded border border-stone-300"
                />
                <input
                  value={c.name}
                  onChange={(e) => setColor(i, { name: e.target.value })}
                  placeholder="Color name, e.g. navy blue"
                  className="flex-1 rounded-md border border-stone-300 px-3 py-2"
                />
                {details.colors.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setDetails((d) => ({
                        ...d,
                        colors: d.colors.filter((_, j) => j !== i),
                      }))
                    }
                    className="px-2 text-stone-400 hover:text-red-600"
                  >
                    ✕
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
                className="text-sm text-stone-600 underline"
              >
                + Add color
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Seasons</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {SEASONS.map((s) => {
              const active = details.seasons.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setDetails((d) => ({
                      ...d,
                      seasons: active
                        ? d.seasons.filter((x) => x !== s)
                        : [...d.seasons, s],
                    }))
                  }
                  className={`rounded-full border px-3 py-1 text-sm capitalize ${active ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 hover:bg-stone-100"}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <button
          disabled={saving || analyzing}
          className="w-full rounded-md bg-stone-900 px-4 py-2.5 text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save to wardrobe"}
        </button>
      </form>
    </div>
  );
}
