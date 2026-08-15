import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Dress Manager",
  description: "Manage your wardrobe. Simplify your style.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo className="h-8 w-8" />
              <span className="text-base font-light uppercase tracking-[0.18em] text-[#1E2B3C]">
                Dress Manager
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {session ? (
                <>
                  <Link href="/wardrobe" className="hover:underline">
                    Wardrobe
                  </Link>
                  <Link
                    href="/wardrobe/new"
                    className="rounded-md bg-stone-900 px-3 py-1.5 text-white hover:bg-stone-700"
                  >
                    + Add item
                  </Link>
                  <span className="hidden text-stone-500 sm:inline">
                    {session.name}
                  </span>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:underline">
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-md bg-stone-900 px-3 py-1.5 text-white hover:bg-stone-700"
                  >
                    Create account
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
