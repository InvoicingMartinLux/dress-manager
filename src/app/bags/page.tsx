import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { Briefcase, ChevronRight } from "lucide-react";
import { bagItems, bags, db, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/auth";
import CreateBagForm from "@/components/CreateBagForm";

export const dynamic = "force-dynamic";

export default async function BagsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await ensureSchema();
  const myBags = await db()
    .select()
    .from(bags)
    .where(eq(bags.userId, session.userId))
    .orderBy(desc(bags.createdAt));

  const memberships = myBags.length
    ? await db()
        .select({ bagId: bagItems.bagId })
        .from(bagItems)
        .where(
          inArray(
            bagItems.bagId,
            myBags.map((b) => b.id)
          )
        )
    : [];

  const counts = new Map<string, number>();
  for (const m of memberships) {
    counts.set(m.bagId, (counts.get(m.bagId) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="label-caps text-ink-faint">Packing</p>
      <h1 className="mt-1 text-[2.25rem] font-bold leading-tight tracking-tight">
        Bags
      </h1>
      <p className="mt-2 max-w-[62ch] text-ink-muted">
        A bag is a subset of your wardrobe for a trip or an occasion. Open a
        piece from inside a bag and it is matched only against what you packed
        alongside it.
      </p>

      <div className="mt-7">
        <CreateBagForm />
      </div>

      {myBags.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-card bg-accent-soft text-accent">
            <Briefcase className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-4 max-w-[46ch] text-ink-muted">
            No bags yet. Name one above, then pack it from your wardrobe.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {myBags.map((bag) => {
            const count = counts.get(bag.id) ?? 0;
            return (
              <li key={bag.id}>
                <Link
                  href={`/bags/${bag.id}`}
                  className="card flex items-center gap-4 p-4 transition-transform duration-200 hover:scale-[1.01] hover:shadow-[var(--shadow-lift)]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-accent-soft text-accent">
                    <Briefcase className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {bag.name}
                    </span>
                    <span className="text-sm text-ink-faint">
                      {count} {count === 1 ? "piece" : "pieces"} packed
                    </span>
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-ink-faint"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
