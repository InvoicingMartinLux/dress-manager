import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  ensureSchema,
  favoriteMatches,
  favoritePair,
  garments,
} from "@/lib/db";
import { getSession } from "@/lib/auth";
import { UUID_PATTERN } from "@/lib/blob";

const bodySchema = z.object({
  otherId: z.string().regex(UUID_PATTERN),
  favorite: z.boolean(),
});

/**
 * Marks or unmarks two garments as a favorite pairing.
 *
 * The pairing is symmetric, so it is stored once with the ids in a fixed
 * order and shows on both garments' pages.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!UUID_PATTERN.test(id) || !parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { otherId, favorite } = parsed.data;
  if (otherId === id) {
    return NextResponse.json(
      { error: "An item cannot be paired with itself." },
      { status: 400 }
    );
  }

  try {
    await ensureSchema();

    // Both garments must belong to the signed-in user.
    const owned = await db()
      .select({ id: garments.id })
      .from(garments)
      .where(
        and(
          eq(garments.userId, session.userId),
          inArray(garments.id, [id, otherId])
        )
      );
    if (owned.length !== 2) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const pair = favoritePair(id, otherId);

    if (favorite) {
      await db()
        .insert(favoriteMatches)
        .values({ userId: session.userId, ...pair })
        .onConflictDoNothing();
    } else {
      await db()
        .delete(favoriteMatches)
        .where(
          and(
            eq(favoriteMatches.userId, session.userId),
            eq(favoriteMatches.garmentAId, pair.garmentAId),
            eq(favoriteMatches.garmentBId, pair.garmentBId)
          )
        );
    }

    return NextResponse.json({ favorite });
  } catch (err) {
    console.error("favorite toggle failed:", err);
    return NextResponse.json(
      { error: `Could not update the pairing: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
