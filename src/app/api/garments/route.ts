import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db, garments, CATEGORIES, PATTERNS, SEASONS } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const maxDuration = 60;

const detailsSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(CATEGORIES),
  subcategory: z.string().max(100).optional().default(""),
  colors: z
    .array(z.object({ name: z.string().max(50), hex: z.string().max(9) }))
    .max(5),
  pattern: z.enum(PATTERNS),
  formality: z.number().int().min(1).max(5),
  seasons: z.array(z.enum(SEASONS)),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const items = await db()
    .select()
    .from(garments)
    .where(eq(garments.userId, session.userId))
    .orderBy(desc(garments.createdAt));
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
  const detailsRaw = form?.get("details");
  if (!(file instanceof File) || typeof detailsRaw !== "string") {
    return NextResponse.json(
      { error: "Image and details are required." },
      { status: 400 }
    );
  }

  let details: z.infer<typeof detailsSchema>;
  try {
    details = detailsSchema.parse(JSON.parse(detailsRaw));
  } catch {
    return NextResponse.json({ error: "Invalid item details." }, { status: 400 });
  }

  const ext = (file.type.split("/")[1] ?? "jpg").replace(/[^a-z0-9]/gi, "");
  const blob = await put(
    `garments/${session.userId}/${crypto.randomUUID()}.${ext}`,
    file,
    { access: "public" }
  );

  const [item] = await db()
    .insert(garments)
    .values({
      userId: session.userId,
      name: details.name,
      category: details.category,
      subcategory: details.subcategory || null,
      colors: details.colors,
      pattern: details.pattern,
      formality: details.formality,
      seasons: details.seasons,
      imageUrl: blob.url,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}
