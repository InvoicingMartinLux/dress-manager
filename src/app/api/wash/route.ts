import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, ensureSchema, garments } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** Empties the laundry basket: clears the dirty flag on every garment. */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    await ensureSchema();
    const washed = await db()
      .update(garments)
      .set({ isDirty: false })
      .where(
        and(eq(garments.userId, session.userId), eq(garments.isDirty, true))
      )
      .returning({ id: garments.id });

    return NextResponse.json({ washed: washed.length });
  } catch (err) {
    console.error("wash failed:", err);
    return NextResponse.json(
      { error: `Could not run the wash: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
