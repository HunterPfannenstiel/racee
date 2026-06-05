"use client";

import { useState } from "react";
import { type Race, type League, type Team, type User, type RaceScoreEntry } from "@/lib/schemas";
import { getMulliganedRaceIds } from "@/lib/scoring";
import { useUser } from "@/app/context/UserContext";
import { LayoutListIcon, TableIcon } from "lucide-react";
import { SeasonStandingsSection } from "./SeasonStandingsSection";
import { StageSectionsBlock } from "./StageSectionsBlock";
import { StageDetailSheet } from "./StageDetailSheet";
import { StandingsTable } from "./StandingsTable";
import { type StandingsRowData } from "./StandingsRow";

export type { StandingsRowData };

type Tab = "drivers" | "constructors";
type ViewMode = "cards" | "table";

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
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
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
    linkTo: `/players/${userId}`,
    raceLinks: Object.fromEntries(
      raceScores.map((r) => [r.raceId, `/picks/${userId}?leagueId=${league.id}&raceId=${r.raceId}`])
    ),
  }));

  const driverTeamContributionByUserId = Object.fromEntries(
    driverRows.map((r) => [r.userId, r.raceScores.reduce((sum, s) => sum + (s.weeklyTeamPoints ?? 0), 0)])
  );

  const mappedConstructorRows: StandingsRowData[] = constructorRows.map(({ teamId, total, rawTotal, propTotal, raceScores }) => ({
    id: teamId,
    label: teamsById[teamId]?.name ?? teamId,
    color: teamsById[teamId]?.color ?? "#6b7280",
    teamName: teamsById[teamId]?.name,
    total,
    rawTotal,
    propTotal,
    raceScores: Object.fromEntries(raceScores.map((r) => [r.raceId, r.weeklyTeamPoints])),
    mulliganedRaceIds: new Set(),
    memberScores: (teamsById[teamId]?.memberIds ?? [])
      .map((uid) => ({ name: usersById[uid]?.name ?? "Unknown", total: driverTeamContributionByUserId[uid] ?? 0 }))
      .sort((a, b) => b.total - a.total),
  }));

  const teamScoringEnabled = (league.teamPositionPoints?.length ?? 0) > 0;
  const currentUserTeamId = teams.find((t) => t.memberIds.includes(user?.id ?? ""))?.id ?? null;
  const currentRowId = tab === "drivers" ? (user?.id ?? null) : currentUserTeamId;
  const rows = tab === "drivers" ? mappedDriverRows : mappedConstructorRows;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
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

        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setViewMode("cards")}
            className={`p-2.5 rounded-md transition-colors ${
              viewMode === "cards"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Card view"
          >
            <LayoutListIcon className="size-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-2.5 rounded-md transition-colors ${
              viewMode === "table"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Table view"
          >
            <TableIcon className="size-4" />
          </button>
        </div>
      </div>

      {tab === "constructors" && !teamScoringEnabled ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          Team scoring is not set up for this league.
        </p>
      ) : viewMode === "table" ? (
        <StandingsTable
          rows={rows}
          races={races}
          nameHeader={tab === "drivers" ? "Player" : "Team"}
          stages={stages}
          showSummary={tab === "drivers"}
        />
      ) : (
        <>
          <SeasonStandingsSection rows={rows} currentRowId={currentRowId} />
          {stages.length > 0 && (
            <StageSectionsBlock
              rows={rows}
              stages={stages}
              currentRowId={currentRowId}
              showStageLabel={!!league.stageCount}
              onRowPress={(rowId, stageIdx) => setSheet({ rowId, stageIdx })}
            />
          )}
        </>
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
