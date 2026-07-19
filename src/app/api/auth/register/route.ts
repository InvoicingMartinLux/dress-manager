import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, users } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

const bodySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide a name, a valid email and a password of at least 8 characters." },
      { status: 400 }
    );
  }
  const { name, email, password } = parsed.data;

  const existing = await db()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()));
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db()
    .insert(users)
    .values({ name, email: email.toLowerCase(), passwordHash })
    .returning();

  await createSession({ userId: user.id, email: user.email, name: user.name });
  return NextResponse.json({ ok: true });
}
