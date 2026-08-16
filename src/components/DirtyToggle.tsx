"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Droplets, Sparkles } from "lucide-react";

export default function DirtyToggle({
  id,
  isDirty,
}: {
  id: string;
  isDirty: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/garments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDirty: !isDirty }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not update this item.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        disabled={busy}
        aria-pressed={isDirty}
        className={`inline-flex items-center gap-1.5 rounded-card border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
          isDirty
            ? "border-accent bg-accent-soft font-medium text-accent"
            : "border-line text-ink-muted hover:text-ink"
        }`}
      >
        {isDirty ? (
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Droplets className="h-4 w-4" aria-hidden="true" />
        )}
        {busy ? "Saving…" : isDirty ? "Mark as clean" : "Mark as dirty"}
      </button>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
