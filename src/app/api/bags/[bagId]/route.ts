import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { bags, db, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { UUID_PATTERN } from "@/lib/blob";

/**
 * Unpacks a bag.
 *
 * Only the bag and its membership rows go; every garment stays in the
 * wardrobe exactly as it was.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ bagId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { bagId } = await params;
  if (!UUID_PATTERN.test(bagId)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    await ensureSchema();
    // bag_items rows are removed by the foreign key's ON DELETE cascade;
    // garments are referenced by those rows, not owned by them.
    const [removed] = await db()
      .delete(bags)
      .where(and(eq(bags.id, bagId), eq(bags.userId, session.userId)))
      .returning({ id: bags.id });

    if (!removed) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("bag delete failed:", err);
    return NextResponse.json(
      { error: `Could not remove the bag: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
