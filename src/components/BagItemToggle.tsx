"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";

export default function BagItemToggle({
  bagId,
  garmentId,
  inBag,
  label,
}: {
  bagId: string;
  garmentId: string;
  inBag: boolean;
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bags/${bagId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ garmentId, inBag: !inBag }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not update the bag.");
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
    <span className="inline-flex flex-col items-start">
      <button
        onClick={toggle}
        disabled={busy}
        title={inBag ? `Take ${label} out of the bag` : `Pack ${label}`}
        className={`inline-flex items-center gap-1.5 rounded-card border px-2.5 py-1 text-xs transition-colors disabled:opacity-50 ${
          inBag
            ? "border-line text-ink-muted hover:text-ink"
            : "border-accent text-accent hover:bg-accent-soft"
        }`}
      >
        {inBag ? (
          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {busy ? "Saving…" : inBag ? "Take out" : "Pack"}
      </button>
      {error && <span className="mt-1 text-xs text-danger">{error}</span>}
    </span>
  );
}
