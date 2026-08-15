import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { db, garments } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { thumbVariant } from "@/lib/blob";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;

  const [item] = await db()
    .delete(garments)
    .where(and(eq(garments.id, id), eq(garments.userId, session.userId)))
    .returning();

  if (!item) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  try {
    await del([item.imageUrl, thumbVariant(item.imageUrl)]);
  } catch {
    // Blob deletion is best-effort; the DB row is already gone.
  }
  return NextResponse.json({ ok: true });
}
