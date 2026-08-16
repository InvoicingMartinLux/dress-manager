import Image from "next/image";
import Link from "next/link";
import { Droplets } from "lucide-react";
import type { Garment } from "@/lib/db/schema";
import { imageRoute } from "@/lib/blob";

export default function GarmentCard({
  garment,
  badge,
}: {
  garment: Garment;
  badge?: React.ReactNode;
}) {
  return (
    <Link
      href={`/wardrobe/${garment.id}`}
      className="card group block overflow-hidden transition-transform duration-200 hover:scale-[1.03] hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative aspect-square bg-canvas">
        {/*
          unoptimized: the Next image optimizer fetches the source server-side
          and caches by URL alone, which would let one account's photo be
          served from cache to another. Going direct keeps every request on
          the owner-checked route.
        */}
        <Image
          src={imageRoute(garment.id, "thumb")}
          alt={garment.name}
          fill
          unoptimized
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
        />
        {badge && <div className="absolute right-2 top-2">{badge}</div>}
        {garment.isDirty && (
          <span
            className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink/85 px-2 py-0.5 text-xs font-medium text-surface"
            title="In the laundry"
          >
            <Droplets className="h-3 w-3" aria-hidden="true" />
            Dirty
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium">{garment.name}</p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="truncate text-xs capitalize text-ink-faint">
            {garment.subcategory || garment.category}
          </span>
          <span className="flex shrink-0 gap-1">
            {garment.colors.slice(0, 3).map((c, i) => (
              <span
                key={i}
                title={c.name}
                className="inline-block h-3 w-3 rounded-full border border-line"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </span>
        </div>
      </div>
    </Link>
  );
}
