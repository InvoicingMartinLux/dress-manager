import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, ensureSchema, packLists } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { UUID_PATTERN } from "@/lib/blob";

const patchSchema = z.object({ name: z.string().trim().min(1).max(120) });

/** Renames a pack list. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { listId } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!UUID_PATTERN.test(listId) || !parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const [updated] = await db()
      .update(packLists)
      .set({ name: parsed.data.name })
      .where(and(eq(packLists.id, listId), eq(packLists.userId, session.userId)))
      .returning();
    if (!updated) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error("pack list rename failed:", err);
    return NextResponse.json(
      { error: `Could not rename the list: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

/** Deletes a pack list. Bags already packed from it are left as they are. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { listId } = await params;
  if (!UUID_PATTERN.test(listId)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    await ensureSchema();
    const [removed] = await db()
      .delete(packLists)
      .where(and(eq(packLists.id, listId), eq(packLists.userId, session.userId)))
      .returning({ id: packLists.id });
    if (!removed) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("pack list delete failed:", err);
    return NextResponse.json(
      { error: `Could not remove the list: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
