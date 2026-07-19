"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const body: Record<string, string> = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };
    if (mode === "register") body.name = String(form.get("name") ?? "");

    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push("/wardrobe");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="text-2xl font-bold">
        {mode === "login" ? "Sign in" : "Create your account"}
      </h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {mode === "register" && (
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={mode === "register" ? 8 : 1}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
          />
          {mode === "register" && (
            <p className="mt-1 text-xs text-stone-500">At least 8 characters.</p>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded-md bg-stone-900 px-4 py-2 text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-sm text-stone-600">
        {mode === "login" ? (
          <>
            No account yet?{" "}
            <Link href="/register" className="underline">
              Create one
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
