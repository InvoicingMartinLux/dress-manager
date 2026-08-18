"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ClipboardList, PackagePlus } from "lucide-react";

export type ApplyablePackList = {
  id: string;
  name: string;
  count: number;
};

/**
 * Packs a bag from one or more pack lists.
 *
 * A list is a template — its pieces are copied into the bag and the two are
 * independent afterwards, so applying the same list twice is harmless.
 */
export default function ApplyPackListsForm({
  bagId,
  lists,
}: {
  bagId: string;
  lists: ApplyablePackList[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  function toggle(id: string) {
    setResult(null);
    setSelected((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id]
    );
  }

  async function apply() {
    if (selected.length === 0) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/bags/${bagId}/apply-lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packListIds: selected }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not pack from the lists.");
        return;
      }
      const added = Number(data.added ?? 0);
      const already = Number(data.alreadyPacked ?? 0);
      setResult(
        added === 0 && already === 0
          ? "Those lists are empty — nothing to pack."
          : `${added} ${added === 1 ? "piece" : "pieces"} packed` +
              (already > 0 ? `, ${already} already in the bag.` : ".")
      );
      setSelected([]);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (lists.length === 0) return null;

  return (
    <div className="card p-5">
      <p className="field-label mb-3 flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-accent" aria-hidden="true" />
        Pack from a list
      </p>

      <ul className="flex flex-wrap gap-2">
        {lists.map((list) => {
          const on = selected.includes(list.id);
          return (
            <li key={list.id}>
              <button
                type="button"
                onClick={() => toggle(list.id)}
                aria-pressed={on}
                className={`inline-flex items-center gap-2 rounded-card border px-3 py-1.5 text-sm transition-colors ${
                  on
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line text-ink-muted hover:text-ink"
                }`}
              >
                {list.name}
                <span className="text-xs opacity-70">{list.count}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={apply}
          disabled={busy || selected.length === 0}
          className="btn btn-primary px-4 py-2 text-sm"
        >
          <PackagePlus className="h-4 w-4" aria-hidden="true" />
          {busy ? "Packing…" : "Add to bag"}
        </button>
        {result && <span className="text-sm text-ink-muted">{result}</span>}
      </div>

      {error && (
        <p className="mt-2 flex items-start gap-2 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
