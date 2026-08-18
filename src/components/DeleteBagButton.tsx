"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteBagButton({
  bagId,
  name,
}: {
  bagId: string;
  name: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (
      !confirm(
        `Remove the bag "${name}"?\n\nThe clothes in it stay in your wardrobe — only the bag goes.`
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bags/${bagId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not remove the bag.");
        return;
      }
      router.push("/bags");
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
        {busy ? "Removing…" : "Remove bag"}
      </button>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
