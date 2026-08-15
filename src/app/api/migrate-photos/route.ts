import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { copy, del } from "@vercel/blob";
import { db, garments } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { thumbVariant } from "@/lib/blob";

export const maxDuration = 60;

/** Kept well inside the function time limit; re-run to continue. */
const BATCH_LIMIT = 40;

type Failure = { id: string; name: string; error: string };

/**
 * Is this blob readable by anyone holding the URL?
 *
 * Rather than inferring from how the row was written, this tests the property
 * that actually matters — an unauthenticated read — by requesting a single
 * byte with no credentials.
 */
async function isPubliclyReadable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: { Range: "bytes=0-0" },
      cache: "no-store",
    });
    return res.ok || res.status === 206;
  } catch {
    // Unreachable is not the same as public; leave it alone.
    return false;
  }
}

/**
 * One-time migration: re-store publicly readable garment photos as private
 * blobs and delete the public originals.
 *
 * Scoped to the signed-in user's own garments, and safe to run repeatedly —
 * photos that are already private are detected and skipped.
 */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let rows;
  try {
    rows = await db()
      .select({
        id: garments.id,
        name: garments.name,
        imageUrl: garments.imageUrl,
      })
      .from(garments)
      .where(eq(garments.userId, session.userId));
  } catch (err) {
    console.error("migration: could not read garments:", err);
    return NextResponse.json(
      { error: `Could not read your wardrobe: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  let migrated = 0;
  let alreadyPrivate = 0;
  let remaining = 0;
  const failures: Failure[] = [];

  for (const row of rows) {
    if (migrated + failures.length >= BATCH_LIMIT) {
      remaining += 1;
      continue;
    }

    if (!(await isPubliclyReadable(row.imageUrl))) {
      alreadyPrivate += 1;
      continue;
    }

    try {
      const oldUrl = row.imageUrl;
      const ext =
        new URL(oldUrl).pathname.match(/\.([a-z0-9]+)$/i)?.[1] ?? "jpg";
      const target = `garments/${session.userId}/${crypto.randomUUID()}.${ext}`;

      // Copy first, repoint the row, and only then remove the original: if a
      // later step fails the garment still has a photo that resolves.
      const copied = await copy(oldUrl, target, {
        access: "private",
        addRandomSuffix: false,
      });

      await db()
        .update(garments)
        .set({ imageUrl: copied.url })
        .where(and(eq(garments.id, row.id), eq(garments.userId, session.userId)));

      try {
        await del([oldUrl, thumbVariant(oldUrl)]);
      } catch (err) {
        // The row already points at the private copy, so a stranded public
        // original is untidy rather than harmful — but it is the whole point
        // of this migration, so surface it.
        console.error("migration: could not delete public original:", err);
        failures.push({
          id: row.id,
          name: row.name,
          error: `Copied to private storage, but the public original could not be deleted: ${(err as Error).message}`,
        });
        continue;
      }

      migrated += 1;
    } catch (err) {
      console.error("migration failed for garment", row.id, err);
      failures.push({
        id: row.id,
        name: row.name,
        error: (err as Error).message,
      });
    }
  }

  return NextResponse.json({
    checked: rows.length,
    migrated,
    alreadyPrivate,
    remaining,
    failures,
  });
}
