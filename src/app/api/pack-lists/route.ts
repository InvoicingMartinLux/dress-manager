import { NextResponse } from "next/server";
import { z } from "zod";
import { db, ensureSchema, packLists } from "@/lib/db";
import { getSession } from "@/lib/auth";

const bodySchema = z.object({ name: z.string().trim().min(1).max(120) });

/** Creates a pack list. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Give the list a name." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const [list] = await db()
      .insert(packLists)
      .values({ userId: session.userId, name: parsed.data.name })
      .returning();
    return NextResponse.json(list, { status: 201 });
  } catch (err) {
    console.error("pack list create failed:", err);
    return NextResponse.json(
      { error: `Could not create the list: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
