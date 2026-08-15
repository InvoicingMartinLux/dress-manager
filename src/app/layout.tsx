import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import "./globals.css";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import NavLink from "@/components/NavLink";
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
      <body className="min-h-[100dvh] antialiased">
        <div className="aurora-field" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>

        <div className="relative z-10 flex min-h-[100dvh] flex-col">
          <header className="sticky top-0 z-[100] border-b border-line bg-surface/85 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-6 py-3">
              <Link href="/" className="flex items-center gap-2.5">
                <Logo className="h-8 w-8" />
                <span className="label-caps text-[0.8125rem] tracking-[0.18em] text-ink">
                  Dress Manager
                </span>
              </Link>

              <nav className="flex items-center gap-5">
                {session ? (
                  <>
                    <NavLink href="/wardrobe">Wardrobe</NavLink>
                    <Link
                      href="/wardrobe/new"
                      className="btn btn-primary px-4 py-2 text-sm"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Add item
                    </Link>
                    <LogoutButton />
                  </>
                ) : (
                  <>
                    <NavLink href="/login">Sign in</NavLink>
                    <Link
                      href="/register"
                      className="btn btn-primary px-4 py-2 text-sm"
                    >
                      Create account
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-[clamp(2rem,5vw,4rem)]">
            {children}
          </main>

          <footer className="border-t border-line px-6 py-6">
            <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 text-sm text-ink-faint">
              <span>Dress Manager — manage your wardrobe, simplify your style.</span>
              <Link href="/setup" className="hover:text-ink-muted">
                Setup check
              </Link>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
