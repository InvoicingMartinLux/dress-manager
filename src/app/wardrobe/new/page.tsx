"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, AlertCircle, Check } from "lucide-react";
import { downscaleImage } from "@/lib/image";
import GarmentFields, {
  cleanColors,
  EMPTY_DETAILS,
  type GarmentDetails,
} from "@/components/GarmentForm";

export default function NewGarmentPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [details, setDetails] = useState<GarmentDetails>(EMPTY_DETAILS);
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
        colors: data.colors?.length ? data.colors : EMPTY_DETAILS.colors,
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

    // A small companion image for the wardrobe grid. Photos are served
    // through an authenticated route, which cannot use Next's image
    // optimizer, so the browser would otherwise download full-size files for
    // every tile.
    const thumbnail = await downscaleImage(file, 480, 0.8);
    if (thumbnail.size < file.size) {
      form.append("thumbnail", thumbnail);
    }

    form.append(
      "details",
      JSON.stringify({ ...details, colors: cleanColors(details.colors) })
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

        <GarmentFields
          details={details}
          setDetails={setDetails}
          disabled={saving}
        />

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
