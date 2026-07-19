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
      className="group overflow-hidden rounded-lg border border-stone-200 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-square bg-stone-100">
        <Image
          src={garment.imageUrl}
          alt={garment.name}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover transition group-hover:scale-105"
        />
        {badge && <div className="absolute right-2 top-2">{badge}</div>}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium">{garment.name}</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs capitalize text-stone-500">
            {garment.subcategory || garment.category}
          </span>
          <span className="flex gap-1">
            {garment.colors.slice(0, 3).map((c, i) => (
              <span
                key={i}
                title={c.name}
                className="inline-block h-3 w-3 rounded-full border border-stone-300"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </span>
        </div>
      </div>
    </Link>
  );
}
