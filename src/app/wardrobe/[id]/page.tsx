import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, garments } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { findMatches } from "@/lib/matching";
import GarmentCard from "@/components/GarmentCard";
import DeleteGarmentButton from "@/components/DeleteGarmentButton";

export const dynamic = "force-dynamic";

function scoreLabel(score: number) {
  if (score >= 75) return { text: "Great match", cls: "bg-green-600" };
  if (score >= 60) return { text: "Good match", cls: "bg-lime-600" };
  if (score >= 45) return { text: "Works", cls: "bg-amber-500" };
  return { text: "Risky", cls: "bg-red-500" };
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

  const matches = findMatches(item, wardrobe);
  const good = matches.filter((m) => m.score >= 45);

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
              <dd>{"●".repeat(item.formality) + "○".repeat(5 - item.formality)}</dd>
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
          {good.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">
              No matching items yet. Add more pieces to your wardrobe — tops,
              shoes and outerwear will show up here with match scores.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {good.map((m) => {
                const label = scoreLabel(m.score);
                return (
                  <div
                    key={m.garment.id}
                    className="flex gap-4 rounded-lg border border-stone-200 bg-white p-3"
                  >
                    <div className="w-28 shrink-0">
                      <GarmentCard
                        garment={m.garment}
                        badge={
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold text-white ${label.cls}`}
                          >
                            {m.score}
                          </span>
                        }
                      />
                    </div>
                    <div className="min-w-0 py-1">
                      <p className="text-sm font-semibold">
                        {label.text} · {m.score}/100
                      </p>
                      <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-stone-600">
                        {m.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {matches.length > good.length && (
            <p className="mt-4 text-xs text-stone-400">
              {matches.length - good.length} item(s) hidden because they scored
              below 45.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
