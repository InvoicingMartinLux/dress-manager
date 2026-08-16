import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { z } from "zod";
import {
  db,
  ensureSchema,
  garments,
  CATEGORIES,
  PATTERNS,
  SEASONS,
} from "@/lib/db";
import { getSession } from "@/lib/auth";
import { thumbVariant, UUID_PATTERN } from "@/lib/blob";

/** Every field is optional: this accepts a full edit or a single flag flip. */
const patchSchema = z
  .object({
    name: z.string().min(1).max(200),
    category: z.enum(CATEGORIES),
    subcategory: z.string().max(100),
    colors: z
      .array(z.object({ name: z.string().max(50), hex: z.string().max(9) }))
      .max(5),
    pattern: z.enum(PATTERNS),
    formality: z.number().int().min(1).max(5),
    seasons: z.array(z.enum(SEASONS)),
    isDirty: z.boolean(),
  })
  .partial();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid changes." }, { status: 400 });
  }
  const { subcategory, ...rest } = parsed.data;
  const values = {
    ...rest,
    ...(subcategory !== undefined ? { subcategory: subcategory || null } : {}),
  };

  if (Object.keys(values).length === 0) {
    return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const [item] = await db()
      .update(garments)
      .set(values)
      .where(and(eq(garments.id, id), eq(garments.userId, session.userId)))
      .returning();

    if (!item) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (err) {
    console.error("garment update failed:", err);
    return NextResponse.json(
      { error: `Saving the changes failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

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
