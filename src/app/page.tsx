import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Logo from "@/components/Logo";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/wardrobe");

  return (
    <div className="mx-auto max-w-2xl py-12 text-center">
      <Logo className="mx-auto h-28 w-28" />
      <h1 className="mt-6 text-3xl font-light uppercase tracking-[0.28em] text-[#1E2B3C] sm:text-4xl">
        Dress Manager
      </h1>
      <p className="mt-3 text-sm uppercase tracking-[0.18em] text-[#B39B7D]">
        Manage your wardrobe. Simplify your style.
      </p>
      <p className="mt-8 text-lg text-stone-600">
        Photograph your clothes, let AI catalog them, and get instant
        suggestions for what goes with what — like which shirts match your blue
        trousers.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/register"
          className="rounded-md bg-stone-900 px-5 py-2.5 text-white hover:bg-stone-700"
        >
          Create account
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-stone-300 px-5 py-2.5 hover:bg-stone-100"
        >
          Sign in
        </Link>
      </div>
      <div className="mt-16 grid gap-6 text-left sm:grid-cols-3">
        <div>
          <div className="text-2xl">📸</div>
          <h3 className="mt-2 font-semibold">Snap &amp; upload</h3>
          <p className="mt-1 text-sm text-stone-600">
            Take a photo of any garment. AI detects the type, colors, pattern
            and formality automatically.
          </p>
        </div>
        <div>
          <div className="text-2xl">🗂️</div>
          <h3 className="mt-2 font-semibold">Browse your closet</h3>
          <p className="mt-1 text-sm text-stone-600">
            All your tops, trousers, shoes and more in one searchable digital
            wardrobe.
          </p>
        </div>
        <div>
          <div className="text-2xl">🎨</div>
          <h3 className="mt-2 font-semibold">Match outfits</h3>
          <p className="mt-1 text-sm text-stone-600">
            Color-theory based recommendations show you which of your pieces
            work together, and why.
          </p>
        </div>
      </div>
    </div>
  );
}
