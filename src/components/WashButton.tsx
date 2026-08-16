"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WashingMachine, Loader2 } from "lucide-react";

export default function WashButton({ dirtyCount }: { dirtyCount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/wash", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "The wash could not be run.");
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
        onClick={run}
        disabled={busy || dirtyCount === 0}
        className="btn btn-ghost"
        title={
          dirtyCount === 0
            ? "Nothing is in the laundry"
            : `Mark ${dirtyCount} item(s) as clean`
        }
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <WashingMachine className="h-4 w-4" aria-hidden="true" />
        )}
        {busy ? "Washing…" : `Wash all (${dirtyCount})`}
      </button>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
