import type { Metadata } from "next";
import PhotoMigrationPanel from "@/components/PhotoMigrationPanel";

export const metadata: Metadata = {
  title: "Maintenance — Dress Manager",
  robots: { index: false, follow: false },
};

/**
 * Home for one-off maintenance actions. Deliberately not linked from the
 * navigation or footer — reach it by URL when it is needed.
 */
export default function MaintenancePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="label-caps text-ink-faint">Maintenance</p>
      <h1 className="mt-1 text-[2.25rem] font-bold leading-tight tracking-tight">
        One-off tasks
      </h1>
      <p className="mt-2 text-ink-muted">
        Actions here affect only your own wardrobe and require you to be signed
        in.
      </p>

      <PhotoMigrationPanel />
    </div>
  );
}
