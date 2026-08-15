"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import Logo from "@/components/Logo";

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
    <div className="mx-auto max-w-md py-[clamp(1rem,4vw,3rem)]">
      <div className="rise card p-8">
        <Logo className="h-12 w-12 text-ink" />
        <h1 className="mt-5 text-[2.25rem] font-bold leading-tight tracking-tight">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-ink-muted">
          {mode === "login"
            ? "Sign in to open your wardrobe."
            : "Your wardrobe is private to you."}
        </p>

        <form onSubmit={onSubmit} className="mt-7 space-y-5">
          {mode === "register" && (
            <div>
              <label htmlFor="name" className="field-label">
                Name
              </label>
              <input id="name" name="name" required className="field" />
            </div>
          )}
          <div>
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="field"
            />
          </div>
          <div>
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={mode === "register" ? 8 : 1}
              className="field"
            />
            {mode === "register" && (
              <p className="mt-1.5 text-sm text-ink-faint">
                At least 8 characters.
              </p>
            )}
          </div>

          {error && (
            <p className="flex items-start gap-2 text-sm text-danger">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {error}
            </p>
          )}

          <button disabled={busy} className="btn btn-primary w-full">
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-ink-muted">
        {mode === "login" ? (
          <>
            No account yet?{" "}
            <Link href="/register" className="text-accent hover:underline">
              Create one
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
