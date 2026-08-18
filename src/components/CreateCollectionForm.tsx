"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Plus } from "lucide-react";

/** Names and creates a bag or a pack list, then opens it. */
export default function CreateCollectionForm({
  endpoint,
  redirectPrefix,
  label,
  placeholder,
  buttonLabel,
}: {
  endpoint: string;
  redirectPrefix: string;
  label: string;
  placeholder: string;
  buttonLabel: string;
}) {
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
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not create this.");
        return;
      }
      setName("");
      router.push(`${redirectPrefix}/${data.id}`);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const fieldId = `${redirectPrefix.replace(/\W/g, "")}-name`;

  return (
    <form onSubmit={onSubmit} className="card p-5">
      <label htmlFor={fieldId} className="field-label">
        {label}
      </label>
      <div className="flex flex-wrap gap-3">
        <input
          id={fieldId}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholder}
          className="field min-w-[12rem] flex-1"
        />
        <button disabled={busy || !name.trim()} className="btn btn-primary">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {busy ? "Creating…" : buttonLabel}
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
