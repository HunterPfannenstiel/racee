"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type Season } from "@/lib/schemas";
import { Card } from "@/components/ui/card";

export default function ViewPage() {
  const router = useRouter();
  const [seasons, setSeasons] = useState<Season[] | null>(null);

  useEffect(() => {
    fetch("/api/seasons")
      .then((r) => r.json())
      .then(setSeasons);
  }, []);

  return (
    <main className="max-w-lg mx-auto px-6 py-10 space-y-4">
      {!seasons ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : seasons.length === 0 ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">No seasons yet.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Season</p>
          <div className="flex flex-wrap gap-2">
            {seasons.map((season) => (
              <Card
                key={season.id}
                size="sm"
                onClick={() => router.push(`/view/${season.id}`)}
                className="cursor-pointer px-4 py-2 transition-colors hover:bg-muted"
              >
                <span className="text-sm font-medium">{season.name}</span>
              </Card>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
