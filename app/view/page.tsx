"use client";

import { useEffect, useState } from "react";
import { type League, type User, type Team, type Race, type RaceScoreEntry } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { LeaguePicker } from "@/components/ui/league-picker";
import { StandingsGrid } from "./StandingsGrid";

type DriverRow = { userId: string; total: number; rawTotal: number; propTotal: number; raceScores: RaceScoreEntry[] };
type ConstructorRow = { teamId: string; total: number; rawTotal: number; propTotal: number; raceScores: RaceScoreEntry[] };

type LeagueData = {
  league: League | null;
  races: Race[];
  usersById: Record<string, User>;
  teams: Team[];
  driverRows: DriverRow[];
  constructorRows: ConstructorRow[];
  stages: string[][];
};

export default function ViewPage() {
  const [leagues, setLeagues] = useState<League[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState<LeagueData | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    fetch("/api/leagues")
      .then((r) => r.json())
      .then((s: League[]) => {
        setLeagues(s);
        if (s.length > 0) setSelectedId(s[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingData(true);
    setData(null);
    fetch(`/api/view/${selectedId}/init`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoadingData(false);
      });
  }, [selectedId]);

  return (
    <PageShell title="Standings">
      {!leagues ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : leagues.length === 0 ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">No leagues yet.</p>
      ) : (
        <div className="space-y-6">
          <LeaguePicker leagues={leagues} selectedLeagueId={selectedId} onSelect={setSelectedId} />

          {loadingData ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs tracking-widest uppercase">Loading</span>
            </div>
          ) : data?.league ? (
            <StandingsGrid
              league={data.league}
              races={data.races}
              usersById={data.usersById}
              teams={data.teams}
              driverRows={data.driverRows}
              constructorRows={data.constructorRows}
              stages={data.stages}
            />
          ) : data && (
            <p className="text-xs tracking-widest uppercase text-muted-foreground">No scores yet.</p>
          )}
        </div>
      )}
    </PageShell>
  );
}
