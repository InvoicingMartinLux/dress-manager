import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, garments, CATEGORIES } from "@/lib/db";
import { getSession } from "@/lib/auth";
import GarmentCard from "@/components/GarmentCard";

export const dynamic = "force-dynamic";

export default async function WardrobePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { category } = await searchParams;
  const items = await db()
    .select()
    .from(garments)
    .where(eq(garments.userId, session.userId))
    .orderBy(desc(garments.createdAt));

  const filtered =
    category && CATEGORIES.includes(category as (typeof CATEGORIES)[number])
      ? items.filter((g) => g.category === category)
      : items;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My wardrobe</h1>
        <Link
          href="/wardrobe/new"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-700"
        >
          + Add item
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link
          href="/wardrobe"
          className={`rounded-full border px-3 py-1 ${!category ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 hover:bg-stone-100"}`}
        >
          All ({items.length})
        </Link>
        {CATEGORIES.map((c) => {
          const count = items.filter((g) => g.category === c).length;
          if (count === 0) return null;
          return (
            <Link
              key={c}
              href={`/wardrobe?category=${c}`}
              className={`rounded-full border px-3 py-1 capitalize ${category === c ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 hover:bg-stone-100"}`}
            >
              {c} ({count})
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 text-center text-stone-500">
          <p className="text-4xl">🧺</p>
          <p className="mt-4">
            Your wardrobe is empty.{" "}
            <Link href="/wardrobe/new" className="underline">
              Add your first item
            </Link>{" "}
            by uploading a photo.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((g) => (
            <GarmentCard key={g.id} garment={g} />
          ))}
        </div>
      )}
    </div>
  );
}
