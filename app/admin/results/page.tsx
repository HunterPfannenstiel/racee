"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type Season, type Race, type Racer, type SeasonStandings } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { SeasonPicker } from "@/components/ui/season-picker";

type ViewInitData = {
  races: Race[];
  standings: SeasonStandings | null;
};

export default function AdminResultsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [racersById, setRacersById] = useState<Record<string, Racer>>({});
  const [gradedRaceIds, setGradedRaceIds] = useState<Set<string>>(new Set());
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const [recalculating, setRecalculating] = useState<string | null>(null);
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
      fetch(`/api/view/${selectedSeasonId}/init`).then((r) => r.json() as Promise<ViewInitData>),
      fetch("/api/racers").then((r) => r.json() as Promise<Racer[]>),
    ])
      .then(([viewData, racerList]) => {
        setRaces(viewData.races);
        setGradedRaceIds(new Set(viewData.standings?.gradedRaceIds ?? []));
        setRacersById(Object.fromEntries(racerList.map((r) => [r.id, r])));
      })
      .catch(() => setError("Failed to load data."))
      .finally(() => setLoadingRaces(false));
  }, [selectedSeasonId]);

  function handleSeasonSelect(id: string) {
    if (id === selectedSeasonId) return;
    setSelectedSeasonId(id);
    setRaces([]);
    setGradedRaceIds(new Set());
  }

  async function handleRecalculate(raceId: string) {
    setRecalculating(raceId);
    setError(null);
    try {
      const res = await fetch(`/api/seasons/${selectedSeasonId}/recalculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raceId }),
      });
      if (!res.ok) { setError("Recalculate failed."); return; }
    } catch {
      setError("Recalculate failed.");
    } finally {
      setRecalculating(null);
    }
  }

  return (
    <PageShell title="Results">
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
          No seasons yet.{" "}
          <Link href="/admin/seasons" className="text-primary hover:underline">Create one first.</Link>
        </p>
      ) : (
        <div className="space-y-6">
          <SeasonPicker seasons={seasons} selectedSeasonId={selectedSeasonId} onSelect={handleSeasonSelect} />

          {loadingRaces ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Spinner className="w-4 h-4" />
              <span className="text-xs tracking-widest uppercase">Loading</span>
            </div>
          ) : races.length === 0 ? (
            <p className="text-xs tracking-widest uppercase text-muted-foreground">No races yet.</p>
          ) : (
            <div className="space-y-8">
              {(() => {
                const today = new Date().toISOString().split("T")[0];
                const asc = (a: Race, b: Race) => a.date.localeCompare(b.date);
                const desc = (a: Race, b: Race) => b.date.localeCompare(a.date);

                const awaiting = races.filter((r) => r.date < today && !gradedRaceIds.has(r.id)).sort(desc);
                const upcoming = races.filter((r) => r.date >= today && !gradedRaceIds.has(r.id)).sort(asc);
                const graded = races.filter((r) => gradedRaceIds.has(r.id)).sort(desc);

                const sections = [
                  { label: "Awaiting Result", races: awaiting },
                  { label: "Upcoming", races: upcoming },
                  { label: "Graded", races: graded },
                ].filter((s) => s.races.length > 0);

                return sections.map(({ label, races: sectionRaces }) => (
                  <section key={label} className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {sectionRaces.map((race) => {
                        const isGraded = gradedRaceIds.has(race.id);
                        const isRecalculating = recalculating === race.id;
                        return (
                          <Card key={race.id} size="sm" className="flex flex-col gap-3 px-4 py-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{race.title}</p>
                              <p className="text-xs text-muted-foreground">{race.date}</p>
                            </div>
                            {isGraded ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={recalculating !== null}
                                onClick={() => handleRecalculate(race.id)}
                                className="w-full"
                              >
                                {isRecalculating && <Spinner className="size-3 mr-1" />}
                                Recalculate
                              </Button>
                            ) : (
                              <Link
                                href={`/admin/results/${selectedSeasonId}/${race.id}`}
                                className="inline-flex items-center justify-center w-full h-8 px-3 text-xs font-medium rounded-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                Set Result
                              </Link>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                ));
              })()}

            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
