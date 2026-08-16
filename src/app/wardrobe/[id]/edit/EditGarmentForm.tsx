"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import GarmentFields, {
  cleanColors,
  type GarmentDetails,
} from "@/components/GarmentForm";

export default function EditGarmentForm({
  id,
  initial,
}: {
  id: string;
  initial: GarmentDetails;
}) {
  const router = useRouter();
  const [details, setDetails] = useState<GarmentDetails>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/garments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...details,
          colors: cleanColors(details.colors),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Saving failed (HTTP ${res.status}).`);
        return;
      }
      router.push(`/wardrobe/${id}`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and retry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-7">
      <GarmentFields
        details={details}
        setDetails={setDetails}
        disabled={saving}
      />

      {error && (
        <p className="flex items-start gap-2 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button disabled={saving} className="btn btn-primary">
          {saving ? "Saving…" : "Save changes"}
        </button>
        <Link href={`/wardrobe/${id}`} className="btn btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
