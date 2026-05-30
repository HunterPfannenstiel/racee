"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type League, type Race, type Racer } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { LeaguePicker } from "@/components/ui/league-picker";

type ViewInitData = {
  races: Race[];
  gradedRaceIds: string[];
};

export default function AdminResultsPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [racersById, setRacersById] = useState<Record<string, Racer>>({});
  const [gradedRaceIds, setGradedRaceIds] = useState<Set<string>>(new Set());
  const [keyDates, setKeyDates] = useState<Record<string, string | null>>({});
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const [recalculating, setRecalculating] = useState<string | null>(null);
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
      fetch(`/api/view/${selectedLeagueId}/init`).then((r) => r.json() as Promise<ViewInitData>),
      fetch("/api/racers").then((r) => r.json() as Promise<Racer[]>),
      fetch(`/api/races/key?leagueId=${selectedLeagueId}`).then((r) => r.json() as Promise<Record<string, string | null>>),
    ])
      .then(([viewData, racerList, dates]) => {
        setRaces(viewData.races);
        setGradedRaceIds(new Set(viewData.gradedRaceIds));
        setRacersById(Object.fromEntries(racerList.map((r) => [r.id, r])));
        setKeyDates(dates);
      })
      .catch(() => setError("Failed to load data."))
      .finally(() => setLoadingRaces(false));
  }, [selectedLeagueId]);

  function handleLeagueSelect(id: string) {
    if (id === selectedLeagueId) return;
    setSelectedLeagueId(id);
    setRaces([]);
    setGradedRaceIds(new Set());
    setKeyDates({});
  }

  async function handleRecalculate(raceId: string) {
    setRecalculating(raceId);
    setError(null);
    try {
      const res = await fetch(`/api/leagues/${selectedLeagueId}/recalculate`, {
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

      {loadingLeagues ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="w-4 h-4" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : leagues.length === 0 ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          No leagues yet.{" "}
          <Link href="/admin/leagues" className="text-primary hover:underline">Create one first.</Link>
        </p>
      ) : (
        <div className="space-y-6">
          <LeaguePicker leagues={leagues} selectedLeagueId={selectedLeagueId} onSelect={handleLeagueSelect} />

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
                              {isGraded && keyDates[race.id] && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Set {new Date(Number(keyDates[race.id]!)).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                                </p>
                              )}
                            </div>
                            {isGraded ? (
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={recalculating !== null}
                                  onClick={() => handleRecalculate(race.id)}
                                  className="flex-1"
                                >
                                  {isRecalculating && <Spinner className="size-3 mr-1" />}
                                  Recalculate
                                </Button>
                                <Link
                                  href={`/admin/results/${selectedLeagueId}/${race.id}`}
                                  className="inline-flex items-center justify-center h-7 px-2.5 text-[0.8rem] font-medium rounded-[min(var(--radius-md),12px)] border border-border bg-background hover:bg-muted hover:text-foreground transition-colors shrink-0"
                                >
                                  Edit
                                </Link>
                              </div>
                            ) : (
                              <Link
                                href={`/admin/results/${selectedLeagueId}/${race.id}`}
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
