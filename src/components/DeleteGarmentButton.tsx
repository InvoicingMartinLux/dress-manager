"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteGarmentButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      disabled={busy}
      onClick={async () => {
        if (!confirm("Remove this item from your wardrobe?")) return;
        setBusy(true);
        await fetch(`/api/garments/${id}`, { method: "DELETE" });
        router.push("/wardrobe");
        router.refresh();
      }}
      className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {busy ? "Removing…" : "Remove"}
    </button>
  );
}
