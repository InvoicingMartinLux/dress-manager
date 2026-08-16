import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db, ensureSchema, garments } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { UUID_PATTERN } from "@/lib/blob";
import EditGarmentForm from "./EditGarmentForm";

export const dynamic = "force-dynamic";

export default async function EditGarmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  await ensureSchema();
  const [item] = await db()
    .select()
    .from(garments)
    .where(and(eq(garments.id, id), eq(garments.userId, session.userId)));

  if (!item) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/wardrobe/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to item
      </Link>

      <p className="label-caps mt-5 text-ink-faint">Edit</p>
      <h1 className="mt-1 text-[2.25rem] font-bold leading-tight tracking-tight">
        {item.name}
      </h1>
      <p className="mt-2 text-ink-muted">
        Correcting these changes what the matching engine recommends — formality
        and seasons carry the most weight after color.
      </p>

      <EditGarmentForm
        id={item.id}
        initial={{
          name: item.name,
          category: item.category,
          subcategory: item.subcategory ?? "",
          colors:
            item.colors.length > 0
              ? item.colors
              : [{ name: "", hex: "#888888" }],
          pattern: item.pattern,
          formality: item.formality,
          seasons: item.seasons,
        }}
      />
    </div>
  );
}
