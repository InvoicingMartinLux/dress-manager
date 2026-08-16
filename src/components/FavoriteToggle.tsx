"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

export default function FavoriteToggle({
  garmentId,
  otherId,
  favorite,
  otherName,
}: {
  garmentId: string;
  otherId: string;
  favorite: boolean;
  otherName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/garments/${garmentId}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherId, favorite: !favorite }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not update the pairing.");
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
        aria-pressed={favorite}
        title={
          favorite
            ? `Remove ${otherName} from your favorite pairings`
            : `Save ${otherName} as a favorite pairing`
        }
        className={`inline-flex items-center gap-1.5 rounded-card border px-2.5 py-1 text-xs transition-colors disabled:opacity-50 ${
          favorite
            ? "border-magenta text-magenta"
            : "border-line text-ink-faint hover:text-ink"
        }`}
      >
        <Heart
          className="h-3.5 w-3.5"
          fill={favorite ? "currentColor" : "none"}
          aria-hidden="true"
        />
        {busy ? "Saving…" : favorite ? "Favorite" : "Save as favorite"}
      </button>
      {error && <span className="mt-1 text-xs text-danger">{error}</span>}
    </span>
  );
}
