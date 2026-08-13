import { sql } from "drizzle-orm";
import { put, del } from "@vercel/blob";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Check = { name: string; ok: boolean; detail: string };

async function checkDatabase(): Promise<Check[]> {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    return [
      {
        name: "Database",
        ok: false,
        detail:
          "DATABASE_URL is not set. Connect a Neon Postgres database in Vercel → Storage, then redeploy.",
      },
    ];
  }
  const checks: Check[] = [];
  for (const table of ["users", "garments"]) {
    try {
      await db().execute(sql.raw(`select 1 from "${table}" limit 1`));
      checks.push({ name: `Table "${table}"`, ok: true, detail: "exists" });
    } catch (err) {
      checks.push({
        name: `Table "${table}"`,
        ok: false,
        detail: `${(err as Error).message} — run the setup SQL in the Neon console.`,
      });
    }
  }
  return checks;
}

async function checkBlob(): Promise<Check> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      name: "Photo storage (Vercel Blob)",
      ok: false,
      detail:
        "BLOB_READ_WRITE_TOKEN is not set. Create/connect a Blob store in Vercel → Storage, then REDEPLOY (new env vars only apply to new deployments).",
    };
  }
  try {
    const blob = await put("diagnostics/health-check.txt", "ok", {
      access: "public",
      addRandomSuffix: true,
    });
    await del(blob.url);
    return {
      name: "Photo storage (Vercel Blob)",
      ok: true,
      detail: "test upload and delete succeeded",
    };
  } catch (err) {
    return {
      name: "Photo storage (Vercel Blob)",
      ok: false,
      detail: (err as Error).message,
    };
  }
}

async function checkAnthropic(): Promise<Check> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      name: "AI photo analysis (Anthropic)",
      ok: false,
      detail:
        "ANTHROPIC_API_KEY is not set. Add it in Vercel → Settings → Environment Variables, then redeploy.",
    };
  }
  try {
    await new Anthropic().messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1,
      messages: [{ role: "user", content: "hi" }],
    });
    return {
      name: "AI photo analysis (Anthropic)",
      ok: true,
      detail: "API key works and the model is reachable",
    };
  } catch (err) {
    return {
      name: "AI photo analysis (Anthropic)",
      ok: false,
      detail: (err as Error).message,
    };
  }
}

async function checkAuth(): Promise<Check> {
  if (!process.env.AUTH_SECRET) {
    return {
      name: "Sign-in secret",
      ok: false,
      detail: "AUTH_SECRET is not set.",
    };
  }
  const session = await getSession();
  return {
    name: "Sign-in secret",
    ok: true,
    detail: session
      ? `set — you are signed in as ${session.email}`
      : "set — you are NOT signed in right now",
  };
}

export default async function SetupPage() {
  const checks: Check[] = [
    ...(await checkDatabase()),
    await checkBlob(),
    await checkAnthropic(),
    await checkAuth(),
  ];
  const failures = checks.filter((c) => !c.ok);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Setup check</h1>
      <p className="mt-1 text-sm text-stone-600">
        Live test of every service the app depends on.
      </p>

      <div
        className={`mt-6 rounded-lg border p-4 ${failures.length === 0 ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}
      >
        {failures.length === 0
          ? "✅ Everything is configured correctly."
          : `❌ ${failures.length} problem(s) found — see the details below.`}
      </div>

      <ul className="mt-6 space-y-3">
        {checks.map((c) => (
          <li
            key={c.name}
            className="rounded-lg border border-stone-200 bg-white p-4"
          >
            <p className="font-medium">
              {c.ok ? "✅" : "❌"} {c.name}
            </p>
            <p className="mt-1 break-words text-sm text-stone-600">{c.detail}</p>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-xs text-stone-400">
        This page reports configuration status only — it never displays secret
        values. Delete <code>src/app/setup/page.tsx</code> once everything works
        if you&apos;d rather not have it public.
      </p>
    </div>
  );
}
