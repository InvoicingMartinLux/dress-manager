import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * Setup self-check. Reports which environment variables are present (never
 * their values) and whether the database tables exist. Sign-in required.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Sign in first, then reload this page." },
      { status: 401 }
    );
  }

  const env = {
    DATABASE_URL:
      process.env.DATABASE_URL || process.env.POSTGRES_URL ? "set" : "MISSING",
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN
      ? "set"
      : "MISSING — connect a Blob store in Vercel → Storage, then redeploy",
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? "set" : "MISSING",
    AUTH_SECRET: process.env.AUTH_SECRET ? "set" : "MISSING",
  };

  const tables: Record<string, string> = {};
  for (const table of ["users", "garments"]) {
    try {
      await db().execute(sql.raw(`select 1 from "${table}" limit 1`));
      tables[table] = "ok";
    } catch (err) {
      tables[table] = `ERROR: ${(err as Error).message}`;
    }
  }

  return NextResponse.json({ env, tables });
}
