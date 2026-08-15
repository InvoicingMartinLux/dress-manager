"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative py-1 text-sm transition-colors ${
        active
          ? "font-medium text-accent"
          : "text-ink-muted hover:text-ink"
      }`}
    >
      {children}
      {active && (
        <span className="absolute -bottom-0.5 left-0 h-0.5 w-full rounded-full bg-accent" />
      )}
    </Link>
  );
}
