"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Plus } from "lucide-react";

export default function CreateBagForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/bags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not create the bag.");
        return;
      }
      setName("");
      router.push(`/bags/${data.id}`);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-5">
      <label htmlFor="bag-name" className="field-label">
        New bag
      </label>
      <div className="flex flex-wrap gap-3">
        <input
          id="bag-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Weekend in Hamburg"
          className="field flex-1 min-w-[12rem]"
        />
        <button disabled={busy || !name.trim()} className="btn btn-primary">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {busy ? "Creating…" : "Create bag"}
        </button>
      </div>
      {error && (
        <p className="mt-2 flex items-start gap-2 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </form>
  );
}
