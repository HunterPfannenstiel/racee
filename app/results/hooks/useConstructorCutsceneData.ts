"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import type { CutsceneData } from "../cutscene/beats/types";
import type { ResultsRowData } from "../types";

/**
 * Data for the constructors reveal: every team's points for one race (the
 * same weekly team points shown in the constructor standings), ranked with
 * ties sharing a place. Returns null when the league doesn't use team scoring
 * or no team scored in that race, so the page can hide the button.
 */
export function useConstructorCutsceneData({
  leagueId,
  raceId,
  raceName,
  leagueName,
  viewerId,
}: {
  leagueId: string | null;
  raceId: string | null;
  raceName: string;
  leagueName: string;
  viewerId: string | null;
}): CutsceneData | null {
  const input = { leagueId: leagueId ?? "" };
  const enabled = !!leagueId;
  const leagueQuery = useQuery(orpc.leagues.get.queryOptions({ input, enabled }));
  const teamScoring = (leagueQuery.data?.teamPositionPoints?.length ?? 0) > 0;
  const teamsQuery = useQuery(orpc.leagues.teams.list.queryOptions({ input, enabled: enabled && teamScoring }));
  const standingsQuery = useQuery(orpc.standings.get.queryOptions({ input, enabled: enabled && teamScoring }));

  return useMemo(() => {
    const teams = teamsQuery.data;
    const standings = standingsQuery.data;
    if (!teamScoring || !teams || !standings || !raceId) return null;

    const teamsById = new Map(teams.map((t) => [t.id, t]));
    const scored = standings.constructorRows
      .map((row) => {
        const score = row.raceScores.find((s) => s.raceId === raceId);
        return score ? { teamId: row.teamId, points: score.weeklyTeamPoints } : null;
      })
      .filter((x): x is { teamId: string; points: number } => x !== null && teamsById.has(x.teamId))
      .sort((a, b) => b.points - a.points);
    if (scored.length === 0) return null;

    const entries: ResultsRowData[] = scored.map((s) => {
      const team = teamsById.get(s.teamId)!;
      return {
        userId: team.id,
        name: team.name,
        total: s.points,
        // Ties share a place (1, 2, 2, 4), matching how driver results rank.
        rank: 1 + scored.filter((o) => o.points > s.points).length,
        color: team.color ?? "#6b7280",
        teamName: "",
      };
    });
    const viewerTeamId = viewerId ? (teams.find((t) => t.memberIds.includes(viewerId))?.id ?? null) : null;

    return {
      entries,
      raceName,
      leagueName: leagueName ? `${leagueName} · Constructors` : "Constructors",
      currentUserId: viewerTeamId,
      mode: "constructors",
      leagueId,
      teams: teams.map((t) => ({ id: t.id, name: t.name, color: t.color, logo: t.logo })),
    };
  }, [teamScoring, teamsQuery.data, standingsQuery.data, raceId, raceName, leagueName, viewerId, leagueId]);
}
