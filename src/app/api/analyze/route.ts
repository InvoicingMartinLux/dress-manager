import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { analyzeGarmentImage } from "@/lib/analyze";

export const maxDuration = 60;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
const MAX_SIZE = 8 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image uploaded." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return NextResponse.json(
      { error: "Please upload a JPEG, PNG, GIF or WebP image." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Image is too large (max 8 MB)." },
      { status: 400 }
    );
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  try {
    const analysis = await analyzeGarmentImage(
      base64,
      file.type as (typeof ALLOWED_TYPES)[number]
    );
    return NextResponse.json(analysis);
  } catch (err) {
    console.error("analyze failed:", err);
    return NextResponse.json(
      { error: "Analysis failed. You can still fill in the details manually." },
      { status: 502 }
    );
  }
}
