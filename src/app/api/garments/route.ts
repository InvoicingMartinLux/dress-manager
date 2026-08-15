import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db, garments, CATEGORIES, PATTERNS, SEASONS } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { thumbVariant } from "@/lib/blob";

export const maxDuration = 60;

/** Vercel caps a serverless function's request body at 4.5 MB. */
const MAX_UPLOAD_SIZE = 4.5 * 1024 * 1024;

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

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      {
        error:
          "That photo is too large to upload (the hosting limit is 4.5 MB per request). Try a smaller photo.",
      },
      { status: 413 }
    );
  }

  // Upload the photo first — a failure here must not leave an orphaned row.
  let imageUrl: string;
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error(
        "BLOB_READ_WRITE_TOKEN is not set — connect a Blob store to the project and redeploy"
      );
    }
    const ext = (file.type.split("/")[1] ?? "jpg").replace(/[^a-z0-9]/gi, "");
    const pathname = `garments/${session.userId}/${crypto.randomUUID()}.${ext}`;
    // Private: the blob has no publicly reachable URL, so the only way to
    // read a photo is through the owner-checked image route.
    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: false,
    });
    imageUrl = blob.url;

    // Optional companion thumbnail for the wardrobe grid. A failure here is
    // not worth losing the upload over — the route falls back to full size.
    const thumbnail = form?.get("thumbnail");
    if (thumbnail instanceof File && thumbnail.size > 0) {
      try {
        await put(thumbVariant(pathname), thumbnail, {
          access: "private",
          addRandomSuffix: false,
        });
      } catch (err) {
        console.error("thumbnail upload failed:", err);
      }
    }
  } catch (err) {
    console.error("blob upload failed:", err);
    return NextResponse.json(
      { error: `Photo upload failed: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  try {
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
        imageUrl,
      })
      .returning();

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("garment insert failed:", err);
    return NextResponse.json(
      { error: `Saving to the database failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
