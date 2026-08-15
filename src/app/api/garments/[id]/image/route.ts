import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { get } from "@vercel/blob";
import { db, garments } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { thumbVariant, UUID_PATTERN } from "@/lib/blob";

/**
 * Streams a garment photo to its owner.
 *
 * Photos are stored as private blobs, so they have no publicly reachable URL;
 * this route is the only way to read one, and it checks both that the caller
 * is signed in and that the garment belongs to them.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Not signed in.", { status: 401 });
  }

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return new NextResponse("Not found.", { status: 404 });
  }

  const [item] = await db()
    .select({ imageUrl: garments.imageUrl })
    .from(garments)
    .where(and(eq(garments.id, id), eq(garments.userId, session.userId)));

  if (!item) {
    return new NextResponse("Not found.", { status: 404 });
  }

  // Fall back to the full-size image when no thumbnail exists — garments
  // added before thumbnails were introduced do not have one.
  const candidates =
    req.nextUrl.searchParams.get("variant") === "thumb"
      ? [thumbVariant(item.imageUrl), item.imageUrl]
      : [item.imageUrl];

  for (const url of candidates) {
    const response = await readBlob(url);
    if (response) return response;
  }

  console.error("blob read failed for garment", id);
  return new NextResponse("Image unavailable.", { status: 502 });
}

async function readBlob(url: string): Promise<NextResponse | null> {
  // Private covers everything uploaded since photos were locked down; public
  // is the fallback for blobs written before that.
  for (const access of ["private", "public"] as const) {
    try {
      const result = await get(url, { access });
      if (result?.statusCode === 200) {
        return new NextResponse(result.stream, {
          headers: {
            "Content-Type": result.blob.contentType,
            "Content-Length": String(result.blob.size),
            // "private" keeps shared caches and CDNs from holding a copy that
            // could be served without the ownership check above.
            "Cache-Control": "private, max-age=3600, must-revalidate",
          },
        });
      }
    } catch {
      // Wrong access mode or missing blob — try the next candidate.
    }
  }
  return null;
}
