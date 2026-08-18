"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";

/** Inline rename for a bag or pack list. */
export default function RenameCollectionForm({
  endpoint,
  currentName,
}: {
  endpoint: string;
  currentName: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim() === currentName) {
      setEditing(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not rename this.");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 rounded-card border border-line px-3 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
        Rename
      </button>
    );
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Name"
        autoFocus
        className="field min-w-[12rem]"
      />
      <button disabled={busy} className="btn btn-primary px-3 py-2 text-sm">
        <Check className="h-4 w-4" aria-hidden="true" />
        {busy ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => {
          setName(currentName);
          setEditing(false);
          setError(null);
        }}
        className="btn btn-ghost px-3 py-2 text-sm"
      >
        <X className="h-4 w-4" aria-hidden="true" />
        Cancel
      </button>
      {error && <span className="w-full text-sm text-danger">{error}</span>}
    </form>
  );
}
