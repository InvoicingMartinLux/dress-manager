import Link from "next/link";
import { redirect } from "next/navigation";
import { Camera, LayoutGrid, Palette, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import Logo from "@/components/Logo";

const FEATURES = [
  {
    icon: Camera,
    title: "Photograph it once",
    body: "Point your camera at a garment and it lands in your wardrobe with its type, colors, pattern, formality and seasons already filled in. Correct anything that looks off before saving.",
    tint: "var(--accent)",
  },
  {
    icon: LayoutGrid,
    title: "Your whole closet, searchable",
    body: "Tops, trousers, shoes and outerwear in one place, filtered by category. No more digging through a drawer to remember whether you own a second olive t-shirt.",
    tint: "var(--magenta)",
  },
  {
    icon: Palette,
    title: "Ranked, with reasons",
    body: "Open your blue trousers and every shirt is scored out of 100 — by color harmony, light/dark contrast, formality and season — with the best match in each category marked and the reasoning shown.",
    tint: "var(--cyan)",
  },
];

/** Decorative stand-in for the hero: overlapping garment swatches on a mesh. */
function HeroVisual() {
  return (
    <div className="relative ml-auto aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-card border border-line bg-surface shadow-[var(--shadow-card)]">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 55% at 22% 22%, var(--aurora-1) 0%, transparent 62%), radial-gradient(55% 55% at 78% 34%, var(--aurora-2) 0%, transparent 62%), radial-gradient(60% 60% at 46% 88%, var(--aurora-3) 0%, transparent 62%)",
        }}
        aria-hidden="true"
      />
      <div className="relative flex h-full items-center justify-center p-10">
        <Logo className="h-full w-full max-w-[220px] text-ink drop-shadow-[0_8px_24px_rgba(16,32,56,0.18)]" />
      </div>
    </div>
  );
}

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/wardrobe");

  return (
    <div className="space-y-[clamp(4rem,8vw,8rem)]">
      {/* Hero: text left, visual right */}
      <section className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <div className="rise">
          <p className="label-caps text-ink-faint">
            Manage your wardrobe. Simplify your style.
          </p>
          <h1 className="mt-4 text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.08] tracking-tight">
            Know what <span className="gradient-text">goes with what</span>.
          </h1>
          <p className="mt-5 max-w-[62ch] text-ink-muted">
            Dress Manager keeps a photographed record of everything you own and
            scores the combinations, so picking an outfit is a choice between
            ranked options rather than a guess in front of an open wardrobe.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="btn btn-primary">
              Create account
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/login" className="btn btn-ghost">
              Sign in
            </Link>
          </div>
        </div>

        <div className="rise rise-1">
          <HeroVisual />
        </div>
      </section>

      {/* Zig-zag feature rows */}
      <section className="space-y-[clamp(3rem,6vw,5rem)]">
        {FEATURES.map(({ icon: Icon, title, body, tint }, i) => (
          <div
            key={title}
            className="grid items-center gap-8 md:grid-cols-2 md:gap-14"
          >
            <div className={i % 2 === 1 ? "md:order-2" : undefined}>
              <span
                className="inline-flex h-12 w-12 items-center justify-center rounded-card"
                style={{
                  backgroundColor: `color-mix(in srgb, ${tint} 14%, transparent)`,
                  color: tint,
                }}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight">{title}</h2>
              <p className="mt-3 max-w-[62ch] text-ink-muted">{body}</p>
            </div>

            <div
              className={`relative aspect-[16/10] w-full max-w-[460px] overflow-hidden rounded-card border border-line bg-surface shadow-[var(--shadow-card)] ${
                i % 2 === 1 ? "md:order-1" : "md:ml-auto"
              }`}
            >
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  background: `radial-gradient(65% 75% at ${
                    i % 2 === 1 ? "72%" : "28%"
                  } 38%, ${tint} 0%, transparent 62%), radial-gradient(50% 60% at ${
                    i % 2 === 1 ? "25%" : "75%"
                  } 82%, var(--aurora-3) 0%, transparent 65%)`,
                }}
                aria-hidden="true"
              />
              <Icon
                className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-ink opacity-30"
                aria-hidden="true"
              />
            </div>
          </div>
        ))}
      </section>

      <section className="card overflow-hidden p-[clamp(2rem,4vw,3.5rem)] text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          Start with one garment
        </h2>
        <p className="mx-auto mt-3 max-w-[52ch] text-ink-muted">
          Matching gets useful the moment you have a handful of pieces in.
          Photograph the trousers you wear most and go from there.
        </p>
        <Link href="/register" className="btn btn-primary mt-6">
          Create your wardrobe
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
