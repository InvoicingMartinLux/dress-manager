import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { bagItems, bags, db, ensureSchema, garments } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { UUID_PATTERN } from "@/lib/blob";

const bodySchema = z.object({
  garmentId: z.string().regex(UUID_PATTERN),
  inBag: z.boolean(),
});

/** Puts a garment in a bag, or takes it out again. */
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
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { garmentId, inBag } = parsed.data;

  try {
    await ensureSchema();

    // The bag and the garment must both belong to the signed-in user.
    const [bag] = await db()
      .select({ id: bags.id })
      .from(bags)
      .where(and(eq(bags.id, bagId), eq(bags.userId, session.userId)));
    const [garment] = await db()
      .select({ id: garments.id })
      .from(garments)
      .where(
        and(eq(garments.id, garmentId), eq(garments.userId, session.userId))
      );
    if (!bag || !garment) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    if (inBag) {
      await db()
        .insert(bagItems)
        .values({ bagId, garmentId })
        .onConflictDoNothing();
    } else {
      await db()
        .delete(bagItems)
        .where(
          and(eq(bagItems.bagId, bagId), eq(bagItems.garmentId, garmentId))
        );
    }

    return NextResponse.json({ inBag });
  } catch (err) {
    console.error("bag membership failed:", err);
    return NextResponse.json(
      { error: `Could not update the bag: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
