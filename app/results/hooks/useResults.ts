"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/app/context/UserContext";
import { useLeague } from "@/app/context/LeagueContext";
import { orpc } from "@/lib/orpc/client";
import type { Race } from "@/lib/schemas";
import type { ResultsEntryDTO } from "@/server/queries/results/IResultsQuery";
import { formatStats } from "../formatStats";
import type { ResultsRowData, StatsData } from "../types";

export type UseResultsResult = {
  races: Race[];
  selectedRaceId: string | null;
  onSelectRace: (raceId: string) => void;
  entries: ResultsRowData[];
  stats: StatsData | null;
  isLoading: boolean;
  currentUserId: string | null;
  // Surfaced separately from `isLoading`/`entries` (rather than folded into
  // them) because ResultsView has no error slot of its own: a failed
  // query would otherwise present as an empty-results state. The page is
  // expected to check this before rendering ResultsView, mirroring the
  // QueryError convention used by the other connected pages (standings,
  // players, picks).
  error: unknown;
  onRetry: () => void;
};

function toRowData(entry: ResultsEntryDTO): ResultsRowData {
  return {
    userId: entry.userId,
    name: entry.name,
    total: entry.total,
    rank: entry.rank,
    color: entry.color,
  };
}

// Derived, not stored: the most recently scored race by date. Mirrors
// autoSelectScoredRace in app/results/page.tsx.
function autoSelectScoredRace(races: Race[]): string | null {
  return (
    [...races]
      .filter((r) => r.keySetAt != null)
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.id ?? null
  );
}

export function useResults(): UseResultsResult {
  const { user, isLoading: userLoading } = useUser();
  const { activeLeagueId } = useLeague();
  const enabled = !!user && !!activeLeagueId;
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);

  const racesQuery = useQuery(
    orpc.races.list.queryOptions({
      input: { leagueId: activeLeagueId ?? "" },
      enabled,
    }),
  );

  const races = racesQuery.data ?? [];
  const scoredRaces = races
    .filter((r) => r.keySetAt != null)
    .sort((a, b) => b.date.localeCompare(a.date));

  const effectiveRaceId =
    selectedRaceId && scoredRaces.some((r) => r.id === selectedRaceId)
      ? selectedRaceId
      : autoSelectScoredRace(races);

  const resultsEnabled = enabled && !!effectiveRaceId;
  const resultsQuery = useQuery(
    orpc.results.get.queryOptions({
      input: { leagueId: activeLeagueId ?? "", raceId: effectiveRaceId ?? "" },
      enabled: resultsEnabled,
    }),
  );

  const queries = resultsEnabled ? [racesQuery, resultsQuery] : [racesQuery];
  const isLoading = userLoading || (enabled && queries.some((q) => q.isPending));
  const firstError = queries.find((q) => q.isError);

  const rawEntries = resultsQuery.data?.entries ?? [];
  const rawStats = resultsQuery.data?.stats ?? null;

  return {
    races,
    selectedRaceId: effectiveRaceId,
    onSelectRace: setSelectedRaceId,
    entries: rawEntries.map(toRowData),
    stats: rawStats ? formatStats(rawStats, rawEntries) : null,
    isLoading,
    currentUserId: user?.id ?? null,
    error: firstError?.error ?? null,
    onRetry: () => queries.forEach((q) => q.refetch()),
  };
}
