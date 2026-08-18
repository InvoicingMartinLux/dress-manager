import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { ChevronRight, ClipboardList } from "lucide-react";
import { db, ensureSchema, packListItems, packLists } from "@/lib/db";
import { getSession } from "@/lib/auth";
import CreateCollectionForm from "@/components/CreateCollectionForm";

export const dynamic = "force-dynamic";

export default async function PackListsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await ensureSchema();
  const myLists = await db()
    .select()
    .from(packLists)
    .where(eq(packLists.userId, session.userId))
    .orderBy(desc(packLists.createdAt));

  const entries = myLists.length
    ? await db()
        .select({ packListId: packListItems.packListId })
        .from(packListItems)
        .where(
          inArray(
            packListItems.packListId,
            myLists.map((l) => l.id)
          )
        )
    : [];

  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.packListId, (counts.get(entry.packListId) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="label-caps text-ink-faint">Packing</p>
      <h1 className="mt-1 text-[2.25rem] font-bold leading-tight tracking-tight">
        Pack lists
      </h1>
      <p className="mt-2 max-w-[62ch] text-ink-muted">
        A pack list is a reusable template — &ldquo;short city trip&rdquo;,
        &ldquo;ski trip&rdquo;. Put the pieces you always take on one, then pack
        a bag from it in a single step.
      </p>

      <div className="mt-7">
        <CreateCollectionForm
          endpoint="/api/pack-lists"
          redirectPrefix="/pack-lists"
          label="New pack list"
          placeholder="Short city trip"
          buttonLabel="Create list"
        />
      </div>

      {myLists.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-card bg-accent-soft text-accent">
            <ClipboardList className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-4 max-w-[46ch] text-ink-muted">
            No pack lists yet. Name one above, then fill it from your wardrobe.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {myLists.map((list) => {
            const count = counts.get(list.id) ?? 0;
            return (
              <li key={list.id}>
                <Link
                  href={`/pack-lists/${list.id}`}
                  className="card flex items-center gap-4 p-4 transition-transform duration-200 hover:scale-[1.01] hover:shadow-[var(--shadow-lift)]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-accent-soft text-accent">
                    <ClipboardList className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {list.name}
                    </span>
                    <span className="text-sm text-ink-faint">
                      {count} {count === 1 ? "piece" : "pieces"} on the list
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
