"use client";

import { useEffect, useState } from "react";
import { type League, type User, type Team, type Race, type RaceScoreEntry } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { useLeague } from "@/app/context/LeagueContext";
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
  const { activeLeagueId, isLoading: leagueLoading } = useLeague();
  const [data, setData] = useState<LeagueData | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!activeLeagueId) return;
    setLoadingData(true);
    setData(null);
    fetch(`/api/view/${activeLeagueId}/init`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoadingData(false);
      });
  }, [activeLeagueId]);

  return (
    <PageShell title="Standings">
      {leagueLoading || loadingData ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : !activeLeagueId ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">No leagues yet.</p>
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
      ) : data ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">No scores yet.</p>
      ) : null}
    </PageShell>
  );
}
