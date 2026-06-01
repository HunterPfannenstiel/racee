"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type Race, type Racer, type Motorsport } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { RacesSection } from "./RacesSection";

export default function AdminRacesPage() {
  const [motorsport, setMotorsport] = useState<Motorsport | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [racers, setRacers] = useState<Racer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/motorsports")
      .then((r) => r.json())
      .then(async (motorsports: Motorsport[]) => {
        if (motorsports.length === 0) {
          setLoading(false);
          return;
        }
        const first = motorsports[0];
        setMotorsport(first);
        const [fetchedRaces, fetchedRacers] = await Promise.all([
          fetch(`/api/races?motorsportId=${first.id}`).then((r) => r.json()),
          fetch("/api/racers").then((r) => r.json()),
        ]);
        setRaces(fetchedRaces);
        setRacers(fetchedRacers);
      })
      .catch(() => setError("Failed to load race data."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell title="Races">
      <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Admin
      </Link>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>✕</Button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="w-4 h-4" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : !motorsport ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          No motorsports configured.
        </p>
      ) : (
        <RacesSection
          motorsportId={motorsport.id}
          races={races}
          racers={racers}
          onRacesChange={setRaces}
          onError={setError}
        />
      )}
    </PageShell>
  );
}
