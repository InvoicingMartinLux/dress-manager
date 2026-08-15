"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

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
      className="inline-flex shrink-0 items-center gap-1.5 rounded-card border border-line px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      {busy ? "Removing…" : "Remove"}
    </button>
  );
}
