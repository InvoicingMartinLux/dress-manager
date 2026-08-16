import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Shirt, Plus, Droplets } from "lucide-react";
import { db, ensureSchema, garments, CATEGORIES } from "@/lib/db";
import { getSession } from "@/lib/auth";
import GarmentCard from "@/components/GarmentCard";
import WashButton from "@/components/WashButton";

export const dynamic = "force-dynamic";

export default async function WardrobePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { category } = await searchParams;
  await ensureSchema();
  const items = await db()
    .select()
    .from(garments)
    .where(eq(garments.userId, session.userId))
    .orderBy(desc(garments.createdAt));

  const dirtyCount = items.filter((g) => g.isDirty).length;
  const filtered =
    category === "dirty"
      ? items.filter((g) => g.isDirty)
      : category && CATEGORIES.includes(category as (typeof CATEGORIES)[number])
        ? items.filter((g) => g.category === category)
        : items;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-ink-faint">Your wardrobe</p>
          <h1 className="mt-1 text-[2.25rem] font-bold leading-tight tracking-tight">
            {items.length} {items.length === 1 ? "piece" : "pieces"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {items.length > 0 && <WashButton dirtyCount={dirtyCount} />}
          <Link href="/wardrobe/new" className="btn btn-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add item
          </Link>
        </div>
      </div>

      {items.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <FilterChip href="/wardrobe" active={!category}>
            All ({items.length})
          </FilterChip>
          {CATEGORIES.map((c) => {
            const count = items.filter((g) => g.category === c).length;
            if (count === 0) return null;
            return (
              <FilterChip
                key={c}
                href={`/wardrobe?category=${c}`}
                active={category === c}
              >
                <span className="capitalize">{c}</span> ({count})
              </FilterChip>
            );
          })}
          {dirtyCount > 0 && (
            <FilterChip href="/wardrobe?category=dirty" active={category === "dirty"}>
              <Droplets className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
              Laundry ({dirtyCount})
            </FilterChip>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card mt-10 flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-card bg-accent-soft text-accent">
            <Shirt className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-semibold">
            {items.length === 0
              ? "Nothing in here yet"
              : "No pieces in this category"}
          </h2>
          <p className="mt-2 max-w-[46ch] text-ink-muted">
            {items.length === 0
              ? "Photograph a garment and it gets catalogued automatically — then matching can start ranking your combinations."
              : "Try another category, or add a piece to fill this one out."}
          </p>
          <Link href="/wardrobe/new" className="btn btn-primary mt-6">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add your first item
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((g, i) => (
            <div
              key={g.id}
              className={`rise ${i > 0 && i < 5 ? `rise-${i}` : ""}`.trim()}
            >
              <GarmentCard garment={g} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-card border px-3.5 py-1.5 text-sm transition-colors ${
        active
          ? "border-accent bg-accent-soft font-medium text-accent"
          : "border-line bg-surface text-ink-muted hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
