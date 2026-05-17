"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type Season, type Race, type Racer } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SeasonPicker } from "@/components/ui/season-picker";
import { RacesSection } from "./RacesSection";

export default function AdminRacesPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [racers, setRacers] = useState<Racer[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/seasons")
      .then((r) => r.json())
      .then((data: Season[]) => {
        setSeasons(data);
        if (data.length > 0) setSelectedSeasonId(data[0].id);
      })
      .finally(() => setLoadingSeasons(false));
  }, []);

  useEffect(() => {
    if (!selectedSeasonId) return;
    setLoadingRaces(true);
    Promise.all([
      fetch(`/api/races?seasonId=${selectedSeasonId}`).then((r) => r.json()),
      fetch("/api/racers").then((r) => r.json()),
    ])
      .then(([fetchedRaces, fetchedRacers]) => {
        setRaces(fetchedRaces);
        setRacers(fetchedRacers);
      })
      .catch(() => setError("Failed to load race data."))
      .finally(() => setLoadingRaces(false));
  }, [selectedSeasonId]);

  function handleSeasonSelect(id: string) {
    if (id === selectedSeasonId) return;
    setSelectedSeasonId(id);
    setRaces([]);
  }

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

      {loadingSeasons ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="w-4 h-4" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : seasons.length === 0 ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          No seasons yet. <Link href="/admin/seasons" className="text-primary hover:underline">Create one first.</Link>
        </p>
      ) : (
        <div className="space-y-6">
          <SeasonPicker seasons={seasons} selectedSeasonId={selectedSeasonId} onSelect={handleSeasonSelect} />

          {loadingRaces ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Spinner className="w-4 h-4" />
              <span className="text-xs tracking-widest uppercase">Loading</span>
            </div>
          ) : selectedSeasonId && (
            <RacesSection
              seasonId={selectedSeasonId}
              races={races}
              racers={racers}
              onRacesChange={setRaces}
              onError={setError}
            />
          )}
        </div>
      )}
    </PageShell>
  );
}
