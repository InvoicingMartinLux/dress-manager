import { NextResponse } from "next/server";
import { z } from "zod";
import { bags, db, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/auth";

const bodySchema = z.object({ name: z.string().trim().min(1).max(120) });

/** Creates a bag. Bags are a view over the wardrobe, not a move. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Give the bag a name." },
      { status: 400 }
    );
  }

  try {
    await ensureSchema();
    const [bag] = await db()
      .insert(bags)
      .values({ userId: session.userId, name: parsed.data.name })
      .returning();
    return NextResponse.json(bag, { status: 201 });
  } catch (err) {
    console.error("bag create failed:", err);
    return NextResponse.json(
      { error: `Could not create the bag: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
