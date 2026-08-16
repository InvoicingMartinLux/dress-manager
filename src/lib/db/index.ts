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
    schemaEnsured = (async () => {
      const database = db();
      // One statement per call: the HTTP driver does not take batches.
      await database.execute(
        sql`ALTER TABLE "garments" ADD COLUMN IF NOT EXISTS "is_dirty" boolean DEFAULT false NOT NULL`
      );
      await database.execute(
        sql`CREATE TABLE IF NOT EXISTS "favorite_matches" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
          "garment_a_id" uuid NOT NULL REFERENCES "garments"("id") ON DELETE cascade,
          "garment_b_id" uuid NOT NULL REFERENCES "garments"("id") ON DELETE cascade,
          "created_at" timestamp DEFAULT now() NOT NULL
        )`
      );
      // Ids are stored smallest-first, so this also prevents the same pairing
      // being saved twice in the opposite order.
      await database.execute(
        sql`CREATE UNIQUE INDEX IF NOT EXISTS "favorite_matches_pair_idx"
            ON "favorite_matches" ("user_id", "garment_a_id", "garment_b_id")`
      );
    })().catch((err) => {
      // Let the next request try again rather than caching the failure.
      schemaEnsured = null;
      throw err;
    });
  }
  return schemaEnsured;
}

export * from "./schema";
