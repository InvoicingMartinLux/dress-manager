import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { ArrowLeft, Briefcase, Droplets } from "lucide-react";
import { bagItems, bags, db, ensureSchema, garments } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { imageRoute, UUID_PATTERN } from "@/lib/blob";
import type { Garment } from "@/lib/db/schema";
import BagItemToggle from "@/components/BagItemToggle";
import DeleteBagButton from "@/components/DeleteBagButton";
import DirtyToggle from "@/components/DirtyToggle";

export const dynamic = "force-dynamic";

function PackedRow({ garment, bagId }: { garment: Garment; bagId: string }) {
  return (
    <div className="card flex items-center gap-4 p-3">
      <Link
        href={`/wardrobe/${garment.id}?bag=${bagId}`}
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-card bg-canvas"
      >
        <Image
          src={imageRoute(garment.id, "thumb")}
          alt={garment.name}
          fill
          unoptimized
          sizes="64px"
          className="object-cover"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/wardrobe/${garment.id}?bag=${bagId}`}
          className="block truncate font-medium hover:underline"
        >
          {garment.name}
        </Link>
        <p className="truncate text-sm capitalize text-ink-faint">
          {garment.subcategory || garment.category}
          {garment.isDirty && " · in the laundry"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <DirtyToggle id={garment.id} isDirty={garment.isDirty} />
          <BagItemToggle
            bagId={bagId}
            garmentId={garment.id}
            inBag
            label={garment.name}
          />
        </div>
      </div>
    </div>
  );
}

export default async function BagPage({
  params,
}: {
  params: Promise<{ bagId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { bagId } = await params;
  if (!UUID_PATTERN.test(bagId)) notFound();

  await ensureSchema();
  const [bag] = await db()
    .select()
    .from(bags)
    .where(and(eq(bags.id, bagId), eq(bags.userId, session.userId)));
  if (!bag) notFound();

  const wardrobe = await db()
    .select()
    .from(garments)
    .where(eq(garments.userId, session.userId))
    .orderBy(desc(garments.createdAt));

  const packedIds = new Set(
    (
      await db()
        .select({ garmentId: bagItems.garmentId })
        .from(bagItems)
        .where(eq(bagItems.bagId, bagId))
    ).map((r) => r.garmentId)
  );

  const packed = wardrobe.filter((g) => packedIds.has(g.id));
  const available = wardrobe.filter((g) => !packedIds.has(g.id));

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/bags"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All bags
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-ink-faint">Bag</p>
          <h1 className="mt-1 text-[2.25rem] font-bold leading-tight tracking-tight">
            {bag.name}
          </h1>
          <p className="mt-1 text-ink-muted">
            {packed.length} {packed.length === 1 ? "piece" : "pieces"} packed
          </p>
        </div>
        <DeleteBagButton bagId={bag.id} name={bag.name} />
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-card bg-accent-soft p-3 text-sm text-accent">
        <Briefcase className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Opening a piece from here matches it only against the rest of this bag.
        Removing the bag leaves every garment in your wardrobe.
      </p>

      <section className="mt-8">
        <h2 className="label-caps text-ink-faint">Packed</h2>
        {packed.length === 0 ? (
          <div className="card mt-3 px-6 py-10 text-center text-ink-muted">
            Nothing packed yet — add pieces from below.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {packed.map((g) => (
              <PackedRow key={g.id} garment={g} bagId={bag.id} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="label-caps text-ink-faint">Add from your wardrobe</h2>
        {available.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            Everything you own is in this bag.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {available.map((g) => (
              <div key={g.id} className="card flex items-center gap-3 p-3">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-card bg-canvas">
                  <Image
                    src={imageRoute(g.id, "thumb")}
                    alt={g.name}
                    fill
                    unoptimized
                    sizes="48px"
                    className="object-cover"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {g.name}
                  </span>
                  {g.isDirty && (
                    <span className="flex items-center gap-1 text-xs text-ink-faint">
                      <Droplets className="h-3 w-3" aria-hidden="true" />
                      In the laundry
                    </span>
                  )}
                </span>
                <BagItemToggle
                  bagId={bag.id}
                  garmentId={g.id}
                  inBag={false}
                  label={g.name}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
