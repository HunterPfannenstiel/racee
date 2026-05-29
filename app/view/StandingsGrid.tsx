"use client";

import { useState } from "react";
import { type Race, type League, type Team, type User, type RaceScoreEntry } from "@/lib/schemas";
import { getMulliganedRaceIds } from "@/lib/scoring";
import { StandingsTable } from "./StandingsTable";
import { type StandingsRowData } from "./StandingsRow";

type Tab = "drivers" | "constructors";

type DriverRow = { userId: string; total: number; raceScores: RaceScoreEntry[] };
type ConstructorRow = { teamId: string; total: number; raceScores: RaceScoreEntry[] };

type StandingsGridProps = {
  league: League;
  races: Race[];
  usersById: Record<string, User>;
  teams: Team[];
  driverRows: DriverRow[];
  constructorRows: ConstructorRow[];
};

export function StandingsGrid({ league, races, usersById, teams, driverRows, constructorRows }: StandingsGridProps) {
  const [tab, setTab] = useState<Tab>("drivers");

  const mulliganCount = league.mulliganCount;
  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const userTeamColor = Object.fromEntries(
    teams.flatMap((t) => t.memberIds.map((uid) => [uid, t.color ?? "#6b7280"]))
  );

  const mappedDriverRows: StandingsRowData[] = driverRows.map(({ userId, total, raceScores }) => ({
    id: userId,
    label: usersById[userId]?.name ?? userId,
    color: userTeamColor[userId] ?? "#6b7280",
    total,
    raceScores: Object.fromEntries(raceScores.map((r) => [r.raceId, r.points])),
    mulliganedRaceIds: getMulliganedRaceIds(raceScores, mulliganCount),
    linkTo: `/profile/${userId}`,
  }));

  const mappedConstructorRows: StandingsRowData[] = constructorRows.map(({ teamId, total, raceScores }) => ({
    id: teamId,
    label: teamsById[teamId]?.name ?? teamId,
    color: teamsById[teamId]?.color ?? "#6b7280",
    total,
    raceScores: Object.fromEntries(raceScores.map((r) => [r.raceId, r.points])),
    mulliganedRaceIds: getMulliganedRaceIds(raceScores, mulliganCount),
  }));

  const rows = tab === "drivers" ? mappedDriverRows : mappedConstructorRows;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["drivers", "constructors"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-md transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <StandingsTable
        rows={rows}
        races={races}
        nameHeader={tab === "drivers" ? "Driver" : "Team"}
      />
    </div>
  );
}
