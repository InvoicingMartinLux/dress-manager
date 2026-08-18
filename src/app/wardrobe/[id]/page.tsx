import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq, or } from "drizzle-orm";
import {
  ArrowLeft,
  Sparkles,
  Shirt,
  Pencil,
  Droplets,
  Heart,
  Briefcase,
} from "lucide-react";
import { bagItems, bags, db, ensureSchema, favoriteMatches, garments } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  countDirtyCandidates,
  findMatches,
  groupByCategory,
  type ScoredMatch,
} from "@/lib/matching";
import { imageRoute, UUID_PATTERN } from "@/lib/blob";
import GarmentCard from "@/components/GarmentCard";
import DeleteGarmentButton from "@/components/DeleteGarmentButton";
import DirtyToggle from "@/components/DirtyToggle";
import FavoriteToggle from "@/components/FavoriteToggle";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  top: "Tops",
  bottom: "Bottoms",
  dress: "Dresses",
  outerwear: "Outerwear",
  shoes: "Shoes",
  accessory: "Accessories",
};

function scoreStyle(score: number) {
  if (score >= 80) return { text: "Excellent", color: "var(--success)" };
  if (score >= 65) return { text: "Strong", color: "var(--accent)" };
  if (score >= 50) return { text: "Works", color: "var(--cyan)" };
  if (score >= 35) return { text: "Weak", color: "var(--magenta)" };
  return { text: "Avoid", color: "var(--danger)" };
}

function MatchRow({
  match,
  best,
  baseId,
}: {
  match: ScoredMatch;
  best: boolean;
  baseId: string;
}) {
  const style = scoreStyle(match.score);
  return (
    <div
      className={`card flex gap-4 p-3 transition-shadow duration-200 hover:shadow-[var(--shadow-lift)] ${
        match.favorite ? "border-magenta" : best ? "border-accent" : ""
      }`}
    >
      <div className="w-24 shrink-0 sm:w-28">
        <GarmentCard
          garment={match.garment}
          badge={
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: style.color }}
            >
              {match.score}
            </span>
          }
        />
      </div>

      <div className="min-w-0 flex-1 py-1">
        <div className="flex flex-wrap items-center gap-2">
          {match.favorite && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-magenta ring-1 ring-magenta">
              <Heart className="h-3 w-3" fill="currentColor" aria-hidden="true" />
              Favorite pairing
            </span>
          )}
          {best && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Best match
            </span>
          )}
          <span className="text-sm font-semibold" style={{ color: style.color }}>
            {style.text}
          </span>
          <span className="font-mono text-xs text-ink-faint">
            {match.score}/100
          </span>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full"
            style={{ width: `${match.score}%`, backgroundColor: style.color }}
          />
        </div>

        <ul className="mt-2 space-y-1 text-sm text-ink-muted">
          {match.reasons.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span
                className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-faint"
                aria-hidden="true"
              />
              {r}
            </li>
          ))}
        </ul>

        <div className="mt-2">
          <FavoriteToggle
            garmentId={baseId}
            otherId={match.garment.id}
            favorite={match.favorite}
            otherName={match.garment.name}
          />
        </div>

        <details className="mt-2 group">
          <summary className="cursor-pointer list-none text-xs text-ink-faint hover:text-ink-muted">
            Why this score
          </summary>
          <ul className="mt-2 space-y-1.5">
            {match.components.map((c) => (
              <li key={c.key} className="flex items-center gap-2 text-xs">
                <span className="w-32 shrink-0 text-ink-faint">{c.label}</span>
                <span className="h-1 w-16 overflow-hidden rounded-full bg-line">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.round(c.value * 100)}%`,
                      backgroundColor: style.color,
                    }}
                  />
                </span>
                <span className="font-mono text-ink-faint">
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bag?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const { bag: bagParam } = await searchParams;

  await ensureSchema();
  const wardrobe = await db()
    .select()
    .from(garments)
    .where(eq(garments.userId, session.userId));

  const item = wardrobe.find((g) => g.id === id);
  if (!item) notFound();

  // Pairings are stored once with the ids in a fixed order, so this garment
  // may be on either side of the row.
  const pairings = await db()
    .select({
      garmentAId: favoriteMatches.garmentAId,
      garmentBId: favoriteMatches.garmentBId,
    })
    .from(favoriteMatches)
    .where(
      and(
        eq(favoriteMatches.userId, session.userId),
        or(
          eq(favoriteMatches.garmentAId, id),
          eq(favoriteMatches.garmentBId, id)
        )
      )
    );
  const favoriteIds = new Set(
    pairings.map((p) => (p.garmentAId === id ? p.garmentBId : p.garmentAId))
  );

  // Opened from a bag: match only against what was packed alongside it.
  let bag: { id: string; name: string } | null = null;
  let candidates = wardrobe;
  if (bagParam && UUID_PATTERN.test(bagParam)) {
    const [found] = await db()
      .select({ id: bags.id, name: bags.name })
      .from(bags)
      .where(and(eq(bags.id, bagParam), eq(bags.userId, session.userId)));
    if (found) {
      bag = found;
      const packed = new Set(
        (
          await db()
            .select({ garmentId: bagItems.garmentId })
            .from(bagItems)
            .where(eq(bagItems.bagId, found.id))
        ).map((r) => r.garmentId)
      );
      candidates = wardrobe.filter((g) => packed.has(g.id) || g.id === item.id);
    }
  }

  const groups = groupByCategory(findMatches(item, candidates, favoriteIds));
  const inLaundry = countDirtyCandidates(item, candidates);

  return (
    <div>
      <Link
        href={bag ? `/bags/${bag.id}` : "/wardrobe"}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {bag ? `Back to ${bag.name}` : "Back to wardrobe"}
      </Link>

      <div className="mt-5 grid gap-10 lg:grid-cols-[340px_1fr] lg:gap-14">
        <div className="rise">
          <div className="card relative aspect-square overflow-hidden">
            <Image
              src={imageRoute(item.id)}
              alt={item.name}
              fill
              unoptimized
              sizes="340px"
              className="object-cover"
              priority
            />
          </div>

          <div className="mt-5">
            <h1 className="text-2xl font-bold leading-tight tracking-tight">
              {item.name}
            </h1>
            <p className="mt-1 text-sm capitalize text-ink-faint">
              {item.subcategory || item.category}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <DirtyToggle id={item.id} isDirty={item.isDirty} />
            <Link
              href={`/wardrobe/${item.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-card border border-line px-3 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
            <DeleteGarmentButton id={item.id} />
          </div>

          {item.isDirty && (
            <p className="mt-3 flex items-start gap-2 rounded-card bg-accent-soft p-3 text-sm text-accent">
              <Droplets className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              This piece is in the laundry, so it is left out of the
              suggestions for your other clothes.
            </p>
          )}

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-faint">Colors</dt>
              <dd className="flex flex-wrap items-center justify-end gap-2">
                {item.colors.map((c, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full border border-line"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="capitalize">{c.name}</span>
                  </span>
                ))}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-faint">Pattern</dt>
              <dd className="capitalize">{item.pattern}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-faint">Formality</dt>
              <dd className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={`h-2 w-2 rounded-full ${
                      n <= item.formality ? "bg-accent" : "bg-line"
                    }`}
                  />
                ))}
              </dd>
            </div>
            {item.seasons.length > 0 && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink-faint">Seasons</dt>
                <dd className="capitalize">{item.seasons.join(", ")}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rise rise-1">
          <h2 className="text-2xl font-bold tracking-tight">
            What goes with this?
          </h2>

          {bag && (
            <p className="mt-2 flex items-start gap-2 rounded-card bg-accent-soft p-3 text-sm text-accent">
              <Briefcase className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Matching within <strong className="font-semibold">{bag.name}</strong>
              . Only what you packed in this bag is considered —{" "}
              <Link href={`/wardrobe/${item.id}`} className="underline">
                match against the whole wardrobe
              </Link>
              .
            </p>
          )}

          {inLaundry > 0 && (
            <p className="mt-2 text-sm text-ink-faint">
              {inLaundry} matching {inLaundry === 1 ? "piece is" : "pieces are"}{" "}
              in the laundry and left out below.
            </p>
          )}

          {groups.length === 0 ? (
            <div className="card mt-5 flex flex-col items-center px-6 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-card bg-accent-soft text-accent">
                <Shirt className="h-7 w-7" aria-hidden="true" />
              </span>
              <p className="mt-4 max-w-[46ch] text-ink-muted">
                Nothing to match against yet. Add a few more pieces — tops,
                shoes and outerwear will appear here, ranked against this one.
              </p>
              <Link href="/wardrobe/new" className="btn btn-primary mt-5">
                Add another piece
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-9">
              {groups.map(({ category, matches }) => {
                // Favorites are never collapsed away, however they scored;
                // the top-scoring piece that is not one gets "Best match".
                const favorites = matches.filter((m) => m.favorite);
                const others = matches.filter((m) => !m.favorite);
                const shown = [...favorites, ...others.slice(0, 5)];
                const rest = others.slice(5);
                const bestId = others[0]?.garment.id;

                return (
                  <section key={category}>
                    <h3 className="label-caps mb-3 text-ink-faint">
                      {CATEGORY_LABELS[category] ?? category}
                    </h3>
                    <div className="space-y-3">
                      {shown.map((m) => (
                        <MatchRow
                          key={m.garment.id}
                          match={m}
                          best={m.garment.id === bestId}
                          baseId={item.id}
                        />
                      ))}
                    </div>
                    {rest.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-ink-muted hover:text-ink">
                          Show {rest.length} weaker{" "}
                          {(CATEGORY_LABELS[category] ?? category).toLowerCase()}
                        </summary>
                        <div className="mt-3 space-y-3">
                          {rest.map((m) => (
                            <MatchRow
                              key={m.garment.id}
                              match={m}
                              best={false}
                              baseId={item.id}
                            />
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
