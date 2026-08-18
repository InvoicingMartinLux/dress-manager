import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  bagItems,
  bags,
  db,
  ensureSchema,
  packListItems,
  packLists,
} from "@/lib/db";
import { getSession } from "@/lib/auth";
import { UUID_PATTERN } from "@/lib/blob";

const bodySchema = z.object({
  packListIds: z.array(z.string().regex(UUID_PATTERN)).min(1).max(50),
});

/**
 * Packs a bag from one or more pack lists.
 *
 * The lists are a template: their garments are copied into the bag, and the
 * two are independent afterwards — editing the list later does not change a
 * bag already packed from it. Pieces already in the bag are left alone.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ bagId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { bagId } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!UUID_PATTERN.test(bagId) || !parsed.success) {
    return NextResponse.json(
      { error: "Choose at least one pack list." },
      { status: 400 }
    );
  }

  try {
    await ensureSchema();

    const [bag] = await db()
      .select({ id: bags.id })
      .from(bags)
      .where(and(eq(bags.id, bagId), eq(bags.userId, session.userId)));
    if (!bag) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    // Only lists the caller owns, so an id from elsewhere cannot pull in
    // another account's garments.
    const owned = await db()
      .select({ id: packLists.id })
      .from(packLists)
      .where(
        and(
          eq(packLists.userId, session.userId),
          inArray(packLists.id, parsed.data.packListIds)
        )
      );
    if (owned.length === 0) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const entries = await db()
      .select({ garmentId: packListItems.garmentId })
      .from(packListItems)
      .where(
        inArray(
          packListItems.packListId,
          owned.map((l) => l.id)
        )
      );

    const garmentIds = [...new Set(entries.map((e) => e.garmentId))];
    if (garmentIds.length === 0) {
      return NextResponse.json({ added: 0, alreadyPacked: 0 });
    }

    const before = await db()
      .select({ garmentId: bagItems.garmentId })
      .from(bagItems)
      .where(eq(bagItems.bagId, bagId));
    const alreadyPacked = new Set(before.map((b) => b.garmentId));

    await db()
      .insert(bagItems)
      .values(garmentIds.map((garmentId) => ({ bagId, garmentId })))
      .onConflictDoNothing();

    const added = garmentIds.filter((id) => !alreadyPacked.has(id)).length;
    return NextResponse.json({
      added,
      alreadyPacked: garmentIds.length - added,
    });
  } catch (err) {
    console.error("apply pack lists failed:", err);
    return NextResponse.json(
      { error: `Could not pack from the lists: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
