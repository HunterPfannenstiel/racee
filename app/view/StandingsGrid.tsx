"use client";

import { useState } from "react";
import { type Race, type League, type Team, type User, type RaceScoreEntry } from "@/lib/schemas";
import { getMulliganedRaceIds } from "@/lib/scoring";
import { StandingsTable } from "./StandingsTable";
import { type StandingsRowData } from "./StandingsRow";

type Tab = "drivers" | "constructors";

type DriverRow = { userId: string; total: number; rawTotal: number; propTotal: number; raceScores: RaceScoreEntry[] };
type ConstructorRow = { teamId: string; total: number; rawTotal: number; propTotal: number; raceScores: RaceScoreEntry[] };

type StandingsGridProps = {
  league: League;
  races: Race[];
  usersById: Record<string, User>;
  teams: Team[];
  driverRows: DriverRow[];
  constructorRows: ConstructorRow[];
  stages: string[][];
};

export function StandingsGrid({ league, races, usersById, teams, driverRows, constructorRows, stages }: StandingsGridProps) {
  const [tab, setTab] = useState<Tab>("drivers");

  const mulliganCount = league.mulliganCount;
  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const userTeamColor = Object.fromEntries(
    teams.flatMap((t) => t.memberIds.map((uid) => [uid, t.color ?? "#6b7280"]))
  );

  const mappedDriverRows: StandingsRowData[] = driverRows.map(({ userId, total, rawTotal, propTotal, raceScores }) => ({
    id: userId,
    label: usersById[userId]?.name ?? "Unknown User",
    color: userTeamColor[userId] ?? "#6b7280",
    total,
    rawTotal,
    propTotal,
    raceScores: Object.fromEntries(raceScores.map((r) => [r.raceId, r.gridPoints + r.propPoints])),
    mulliganedRaceIds: getMulliganedRaceIds(raceScores, mulliganCount),
    linkTo: `/profile/${userId}`,
  }));

  const mappedConstructorRows: StandingsRowData[] = constructorRows.map(({ teamId, total, rawTotal, propTotal, raceScores }) => ({
    id: teamId,
    label: teamsById[teamId]?.name ?? teamId,
    color: teamsById[teamId]?.color ?? "#6b7280",
    total,
    rawTotal,
    propTotal,
    raceScores: Object.fromEntries(raceScores.map((r) => [r.raceId, r.gridPoints + r.propPoints])),
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
        stages={stages}
      />
    </div>
  );
}
