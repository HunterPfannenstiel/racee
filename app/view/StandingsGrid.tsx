"use client";

import { useState } from "react";
import { type Race, type League, type Team, type User, type RaceScoreEntry } from "@/lib/schemas";
import { getMulliganedRaceIds } from "@/lib/scoring";
import { useUser } from "@/app/context/UserContext";
import { SeasonStandingsSection } from "./SeasonStandingsSection";
import { StageSectionsBlock } from "./StageSectionsBlock";
import { StageDetailSheet } from "./StageDetailSheet";
type Tab = "drivers" | "constructors";

export type StandingsRowData = {
  id: string;
  label: string;
  color: string;
  teamName?: string;
  total: number;
  rawTotal: number;
  propTotal: number;
  raceScores: Record<string, number>;
  mulliganedRaceIds: Set<string>;
  linkTo?: string;
  raceLinks?: Record<string, string>;
};

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
  const [sheet, setSheet] = useState<{ rowId: string; stageIdx: number } | null>(null);
  const { user } = useUser();

  const mulliganCount = league.mulliganCount;
  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const userTeamColor = Object.fromEntries(
    teams.flatMap((t) => t.memberIds.map((uid) => [uid, t.color ?? "#6b7280"]))
  );
  const userTeamName = Object.fromEntries(
    teams.flatMap((t) => t.memberIds.map((uid) => [uid, t.name]))
  );

  const mappedDriverRows: StandingsRowData[] = driverRows.map(({ userId, total, rawTotal, propTotal, raceScores }) => ({
    id: userId,
    label: usersById[userId]?.name ?? "Unknown User",
    color: userTeamColor[userId] ?? "#6b7280",
    teamName: userTeamName[userId],
    total,
    rawTotal,
    propTotal,
    raceScores: Object.fromEntries(raceScores.map((r) => [r.raceId, r.gridPoints + r.propPoints])),
    mulliganedRaceIds: getMulliganedRaceIds(raceScores, mulliganCount),
    linkTo: `/picks/${userId}`,
    raceLinks: Object.fromEntries(
      raceScores.map((r) => [r.raceId, `/picks/${userId}?leagueId=${league.id}&raceId=${r.raceId}`])
    ),
  }));

  const mappedConstructorRows: StandingsRowData[] = constructorRows.map(({ teamId, total, rawTotal, propTotal, raceScores }) => ({
    id: teamId,
    label: teamsById[teamId]?.name ?? teamId,
    color: teamsById[teamId]?.color ?? "#6b7280",
    teamName: teamsById[teamId]?.name,
    total,
    rawTotal,
    propTotal,
    raceScores: Object.fromEntries(raceScores.map((r) => [r.raceId, r.gridPoints + r.propPoints])),
    mulliganedRaceIds: getMulliganedRaceIds(raceScores, mulliganCount),
  }));

  const currentUserTeamId = teams.find((t) => t.memberIds.includes(user?.id ?? ""))?.id ?? null;
  const currentRowId = tab === "drivers" ? (user?.id ?? null) : currentUserTeamId;
  const rows = tab === "drivers" ? mappedDriverRows : mappedConstructorRows;

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {(["drivers", "constructors"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-mono text-sm font-semibold uppercase tracking-[0.06em] px-4 min-h-[44px] rounded-md transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <SeasonStandingsSection rows={rows} currentRowId={currentRowId} />
      {stages.length > 0 && (
        <StageSectionsBlock
          rows={rows}
          stages={stages}
          currentRowId={currentRowId}
          onRowPress={(rowId, stageIdx) => setSheet({ rowId, stageIdx })}
        />
      )}

      <StageDetailSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        rows={rows}
        selectedRowId={sheet?.rowId ?? null}
        stageIdx={sheet?.stageIdx ?? null}
        stages={stages}
        races={races}
      />
    </div>
  );
}
