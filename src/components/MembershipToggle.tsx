"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";

/**
 * Adds or removes a garment from a collection (a bag, a pack list).
 *
 * The endpoint and the boolean's field name are props so both collection
 * types share one component; every prop stays serialisable, since this is
 * rendered from server components.
 */
export default function MembershipToggle({
  endpoint,
  garmentId,
  flagKey,
  member,
  label,
  addLabel = "Add",
  removeLabel = "Remove",
}: {
  endpoint: string;
  garmentId: string;
  flagKey: string;
  member: boolean;
  label: string;
  addLabel?: string;
  removeLabel?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ garmentId, [flagKey]: !member }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not update this.");
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
        title={`${member ? removeLabel : addLabel} — ${label}`}
        className={`inline-flex items-center gap-1.5 rounded-card border px-2.5 py-1 text-xs transition-colors disabled:opacity-50 ${
          member
            ? "border-line text-ink-muted hover:text-ink"
            : "border-accent text-accent hover:bg-accent-soft"
        }`}
      >
        {member ? (
          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {busy ? "Saving…" : member ? removeLabel : addLabel}
      </button>
      {error && <span className="mt-1 text-xs text-danger">{error}</span>}
    </span>
  );
}
