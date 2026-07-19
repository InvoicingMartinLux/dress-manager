import { drizzle } from "drizzle-orm/neon-http";
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

export * from "./schema";
