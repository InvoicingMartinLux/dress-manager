import Image from "next/image";
import Link from "next/link";
import type { Garment } from "@/lib/db/schema";

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
        <Image
          src={garment.imageUrl}
          alt={garment.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
        />
        {badge && <div className="absolute right-2 top-2">{badge}</div>}
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
