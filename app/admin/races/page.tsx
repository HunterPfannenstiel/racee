"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type League, type Race, type Racer } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LeaguePicker } from "@/components/ui/league-picker";
import { RacesSection } from "./RacesSection";

export default function AdminRacesPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [racers, setRacers] = useState<Racer[]>([]);
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leagues")
      .then((r) => r.json())
      .then((data: League[]) => {
        setLeagues(data);
        if (data.length > 0) setSelectedLeagueId(data[0].id);
      })
      .finally(() => setLoadingLeagues(false));
  }, []);

  useEffect(() => {
    if (!selectedLeagueId) return;
    setLoadingRaces(true);
    Promise.all([
      fetch(`/api/races?leagueId=${selectedLeagueId}`).then((r) => r.json()),
      fetch("/api/racers").then((r) => r.json()),
    ])
      .then(([fetchedRaces, fetchedRacers]) => {
        setRaces(fetchedRaces);
        setRacers(fetchedRacers);
      })
      .catch(() => setError("Failed to load race data."))
      .finally(() => setLoadingRaces(false));
  }, [selectedLeagueId]);

  function handleLeagueSelect(id: string) {
    if (id === selectedLeagueId) return;
    setSelectedLeagueId(id);
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

      {loadingLeagues ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="w-4 h-4" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : leagues.length === 0 ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          No leagues yet. <Link href="/admin/leagues" className="text-primary hover:underline">Create one first.</Link>
        </p>
      ) : (
        <div className="space-y-6">
          <LeaguePicker leagues={leagues} selectedLeagueId={selectedLeagueId} onSelect={handleLeagueSelect} />

          {loadingRaces ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Spinner className="w-4 h-4" />
              <span className="text-xs tracking-widest uppercase">Loading</span>
            </div>
          ) : selectedLeagueId && (
            <RacesSection
              leagueId={selectedLeagueId}
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
