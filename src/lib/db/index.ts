import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function db() {
  if (!_db) {
    const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Add a Neon/Vercel Postgres database and set DATABASE_URL."
      );
    }
    _db = drizzle(neon(url), { schema });
  }
  return _db;
}

let schemaEnsured: Promise<void> | null = null;

/**
 * Applies additive schema changes that shipped after the initial setup.
 *
 * The operator administers this app from a browser and has no terminal, so
 * requiring a manual migration would leave the app broken between the deploy
 * and the migration being run. These statements are idempotent and additive,
 * and run at most once per server process.
 */
export function ensureSchema(): Promise<void> {
  if (!schemaEnsured) {
    schemaEnsured = db()
      .execute(
        sql`ALTER TABLE "garments" ADD COLUMN IF NOT EXISTS "is_dirty" boolean DEFAULT false NOT NULL`
      )
      .then(() => undefined)
      .catch((err) => {
        // Let the next request try again rather than caching the failure.
        schemaEnsured = null;
        throw err;
      });
  }
  return schemaEnsured;
}

export * from "./schema";
