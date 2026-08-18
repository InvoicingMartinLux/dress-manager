import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, ensureSchema, garments, packListItems, packLists } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { UUID_PATTERN } from "@/lib/blob";

const bodySchema = z.object({
  garmentId: z.string().regex(UUID_PATTERN),
  inList: z.boolean(),
});

/** Puts a garment on a pack list, or takes it off. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { listId } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!UUID_PATTERN.test(listId) || !parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { garmentId, inList } = parsed.data;

  try {
    await ensureSchema();

    const [list] = await db()
      .select({ id: packLists.id })
      .from(packLists)
      .where(and(eq(packLists.id, listId), eq(packLists.userId, session.userId)));
    const [garment] = await db()
      .select({ id: garments.id })
      .from(garments)
      .where(
        and(eq(garments.id, garmentId), eq(garments.userId, session.userId))
      );
    if (!list || !garment) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    if (inList) {
      await db()
        .insert(packListItems)
        .values({ packListId: listId, garmentId })
        .onConflictDoNothing();
    } else {
      await db()
        .delete(packListItems)
        .where(
          and(
            eq(packListItems.packListId, listId),
            eq(packListItems.garmentId, garmentId)
          )
        );
    }

    return NextResponse.json({ inList });
  } catch (err) {
    console.error("pack list membership failed:", err);
    return NextResponse.json(
      { error: `Could not update the list: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
