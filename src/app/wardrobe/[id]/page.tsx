import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, garments } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { findMatches, groupByCategory, type ScoredMatch } from "@/lib/matching";
import GarmentCard from "@/components/GarmentCard";
import DeleteGarmentButton from "@/components/DeleteGarmentButton";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  top: "Tops",
  bottom: "Bottoms",
  dress: "Dresses",
  outerwear: "Outerwear",
  shoes: "Shoes",
  accessory: "Accessories",
};

function scoreLabel(score: number) {
  if (score >= 80) return { text: "Excellent", cls: "bg-green-600" };
  if (score >= 65) return { text: "Strong", cls: "bg-lime-600" };
  if (score >= 50) return { text: "Works", cls: "bg-amber-500" };
  if (score >= 35) return { text: "Weak", cls: "bg-orange-500" };
  return { text: "Avoid", cls: "bg-red-500" };
}

function MatchRow({ match, best }: { match: ScoredMatch; best: boolean }) {
  const label = scoreLabel(match.score);
  return (
    <div
      className={`flex gap-4 rounded-lg border bg-white p-3 ${best ? "border-stone-900 shadow-sm" : "border-stone-200"}`}
    >
      <div className="w-24 shrink-0 sm:w-28">
        <GarmentCard
          garment={match.garment}
          badge={
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold text-white ${label.cls}`}
            >
              {match.score}
            </span>
          }
        />
      </div>
      <div className="min-w-0 flex-1 py-1">
        <div className="flex flex-wrap items-center gap-2">
          {best && (
            <span className="rounded-full bg-stone-900 px-2 py-0.5 text-xs font-semibold text-white">
              ★ Best match
            </span>
          )}
          <span className="text-sm font-semibold">
            {label.text} · {match.score}/100
          </span>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div
            className={`h-full rounded-full ${label.cls}`}
            style={{ width: `${match.score}%` }}
          />
        </div>

        <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm text-stone-600">
          {match.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>

        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-stone-400 hover:text-stone-600">
            Why this score
          </summary>
          <ul className="mt-2 space-y-1">
            {match.components.map((c) => (
              <li key={c.key} className="flex items-center gap-2 text-xs">
                <span className="w-32 shrink-0 text-stone-500">{c.label}</span>
                <span className="h-1 w-16 overflow-hidden rounded-full bg-stone-100">
                  <span
                    className="block h-full rounded-full bg-stone-400"
                    style={{ width: `${Math.round(c.value * 100)}%` }}
                  />
                </span>
                <span className="tabular-nums text-stone-400">
                  {Math.round(c.value * 10)}/10
                </span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}

export default async function GarmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const wardrobe = await db()
    .select()
    .from(garments)
    .where(eq(garments.userId, session.userId));

  const item = wardrobe.find((g) => g.id === id);
  if (!item) notFound();

  const groups = groupByCategory(findMatches(item, wardrobe));

  return (
    <div>
      <Link href="/wardrobe" className="text-sm text-stone-500 hover:underline">
        ← Back to wardrobe
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-[320px_1fr]">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="320px"
              className="object-cover"
              priority
            />
          </div>
          <div className="mt-4 flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold">{item.name}</h1>
              <p className="text-sm capitalize text-stone-500">
                {item.subcategory || item.category}
              </p>
            </div>
            <DeleteGarmentButton id={item.id} />
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">Colors</dt>
              <dd className="flex items-center gap-1.5">
                {item.colors.map((c, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full border border-stone-300"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="capitalize">{c.name}</span>
                  </span>
                ))}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Pattern</dt>
              <dd className="capitalize">{item.pattern}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Formality</dt>
              <dd>
                {"●".repeat(item.formality) + "○".repeat(5 - item.formality)}
              </dd>
            </div>
            {item.seasons.length > 0 && (
              <div className="flex justify-between">
                <dt className="text-stone-500">Seasons</dt>
                <dd className="capitalize">{item.seasons.join(", ")}</dd>
              </div>
            )}
          </dl>
        </div>

        <div>
          <h2 className="text-lg font-semibold">What goes with this?</h2>
          {groups.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">
              No matching items yet. Add more pieces to your wardrobe — tops,
              shoes and outerwear will show up here, ranked.
            </p>
          ) : (
            <div className="mt-4 space-y-8">
              {groups.map(({ category, matches }) => {
                const shown = matches.slice(0, 5);
                const rest = matches.slice(5);
                return (
                  <section key={category}>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
                      {CATEGORY_LABELS[category] ?? category}
                    </h3>
                    <div className="space-y-3">
                      {shown.map((m, i) => (
                        <MatchRow key={m.garment.id} match={m} best={i === 0} />
                      ))}
                    </div>
                    {rest.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-stone-500 hover:text-stone-900">
                          Show {rest.length} weaker{" "}
                          {(CATEGORY_LABELS[category] ?? category).toLowerCase()}
                        </summary>
                        <div className="mt-3 space-y-3">
                          {rest.map((m) => (
                            <MatchRow key={m.garment.id} match={m} best={false} />
                          ))}
                        </div>
                      </details>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
