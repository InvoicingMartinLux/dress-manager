"use client";

import { useState } from "react";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

type Result = {
  checked: number;
  migrated: number;
  alreadyPrivate: number;
  remaining: number;
  failures: { id: string; name: string; error: string }[];
};

export default function PhotoMigrationPanel() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/migrate-photos", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.error ??
            (res.status === 401
              ? "Sign in first, then run this again."
              : `Migration failed (HTTP ${res.status}).`)
        );
        return;
      }
      setResult(data as Result);
    } catch {
      setError("Could not reach the server. Check your connection and retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card mt-5 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-accent-soft text-accent">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold">Move old photos to private storage</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Photos added before private storage was introduced can still be
            opened by anyone holding their storage address. This copies each
            one into private storage and deletes the public original. It only
            touches your own wardrobe, and it is safe to run more than once.
          </p>
        </div>
      </div>

      <button
        onClick={run}
        disabled={busy}
        className="btn btn-primary mt-4"
        aria-busy={busy}
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {busy ? "Migrating…" : "Run migration"}
      </button>

      {error && (
        <p className="mt-4 flex items-start gap-2 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 space-y-2 text-sm">
          <p className="text-ink-muted">
            Checked {result.checked}{" "}
            {result.checked === 1 ? "photo" : "photos"}:{" "}
            <strong className="text-ink">{result.migrated}</strong> moved to
            private storage,{" "}
            <strong className="text-ink">{result.alreadyPrivate}</strong>{" "}
            already private.
          </p>

          {result.remaining > 0 && (
            <p className="text-ink-muted">
              {result.remaining} left over from this batch — run it once more
              to continue.
            </p>
          )}

          {result.failures.length > 0 ? (
            <ul className="space-y-1">
              {result.failures.map((f) => (
                <li key={f.id} className="flex items-start gap-2 text-danger">
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    {f.name}: {f.error}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            result.remaining === 0 && (
              <p className="text-success">
                Every photo in your wardrobe is now in private storage.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}
