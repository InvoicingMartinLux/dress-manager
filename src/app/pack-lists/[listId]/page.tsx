import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { ArrowLeft, ClipboardList, Droplets } from "lucide-react";
import { db, ensureSchema, garments, packListItems, packLists } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { imageRoute, UUID_PATTERN } from "@/lib/blob";
import type { Garment } from "@/lib/db/schema";
import MembershipToggle from "@/components/MembershipToggle";
import DeleteCollectionButton from "@/components/DeleteCollectionButton";
import RenameCollectionForm from "@/components/RenameCollectionForm";

export const dynamic = "force-dynamic";

function GarmentRow({
  garment,
  listId,
  member,
}: {
  garment: Garment;
  listId: string;
  member: boolean;
}) {
  return (
    <div className="card flex items-center gap-3 p-3">
      <Link
        href={`/wardrobe/${garment.id}`}
        className="relative h-12 w-12 shrink-0 overflow-hidden rounded-card bg-canvas"
      >
        <Image
          src={imageRoute(garment.id, "thumb")}
          alt={garment.name}
          fill
          unoptimized
          sizes="48px"
          className="object-cover"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/wardrobe/${garment.id}`}
          className="block truncate text-sm font-medium hover:underline"
        >
          {garment.name}
        </Link>
        <p className="truncate text-xs capitalize text-ink-faint">
          {garment.subcategory || garment.category}
        </p>
        {garment.isDirty && (
          <p className="flex items-center gap-1 text-xs text-ink-faint">
            <Droplets className="h-3 w-3" aria-hidden="true" />
            In the laundry
          </p>
        )}
      </div>
      <MembershipToggle
        endpoint={`/api/pack-lists/${listId}/items`}
        garmentId={garment.id}
        flagKey="inList"
        member={member}
        label={garment.name}
        addLabel="Add"
        removeLabel="Take off"
      />
    </div>
  );
}

export default async function PackListPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { listId } = await params;
  if (!UUID_PATTERN.test(listId)) notFound();

  await ensureSchema();
  const [list] = await db()
    .select()
    .from(packLists)
    .where(and(eq(packLists.id, listId), eq(packLists.userId, session.userId)));
  if (!list) notFound();

  const wardrobe = await db()
    .select()
    .from(garments)
    .where(eq(garments.userId, session.userId))
    .orderBy(desc(garments.createdAt));

  const onListIds = new Set(
    (
      await db()
        .select({ garmentId: packListItems.garmentId })
        .from(packListItems)
        .where(eq(packListItems.packListId, listId))
    ).map((r) => r.garmentId)
  );

  const onList = wardrobe.filter((g) => onListIds.has(g.id));
  const available = wardrobe.filter((g) => !onListIds.has(g.id));

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/pack-lists"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All pack lists
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-ink-faint">Pack list</p>
          <h1 className="mt-1 text-[2.25rem] font-bold leading-tight tracking-tight">
            {list.name}
          </h1>
          <p className="mt-1 text-ink-muted">
            {onList.length} {onList.length === 1 ? "piece" : "pieces"} on the
            list
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RenameCollectionForm
            endpoint={`/api/pack-lists/${list.id}`}
            currentName={list.name}
          />
          <DeleteCollectionButton
            endpoint={`/api/pack-lists/${list.id}`}
            redirectTo="/pack-lists"
            label="Delete list"
            confirmText={`Delete the pack list "${list.name}"?\n\nYour clothes and any bag already packed from it stay as they are.`}
          />
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-card bg-accent-soft p-3 text-sm text-accent">
        <ClipboardList className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Open a bag to pack it from this list. The list stays a template — what
        you change here later does not touch a bag you already packed.
      </p>

      <section className="mt-8">
        <h2 className="label-caps text-ink-faint">On the list</h2>
        {onList.length === 0 ? (
          <div className="card mt-3 px-6 py-10 text-center text-ink-muted">
            Nothing on this list yet — add pieces from below.
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {onList.map((g) => (
              <GarmentRow key={g.id} garment={g} listId={list.id} member />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="label-caps text-ink-faint">Add from your wardrobe</h2>
        {available.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            Everything you own is on this list.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {available.map((g) => (
              <GarmentRow
                key={g.id}
                garment={g}
                listId={list.id}
                member={false}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
