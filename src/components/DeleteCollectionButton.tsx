"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

/** Deletes a bag or a pack list. Garments are never touched. */
export default function DeleteCollectionButton({
  endpoint,
  redirectTo,
  confirmText,
  label = "Delete",
}: {
  endpoint: string;
  redirectTo: string;
  confirmText: string;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not remove this.");
        return;
      }
      router.push(redirectTo);
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
        onClick={remove}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-card border border-line px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {busy ? "Removing…" : label}
      </button>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
