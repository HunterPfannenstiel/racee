"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/ui/page-shell";
import { QueryError, QueryLoading } from "@/components/ui/query-state";
import { useUser } from "@/app/context/UserContext";
import { useLeague } from "@/app/context/LeagueContext";
import { orpc } from "@/lib/orpc/client";
import type { Race } from "@/lib/schemas";

// Derived, not stored: the most recently scored race by date. Pure function of
// the fetched race list, mirrors app/predict/page.tsx's autoSelectRace pattern.
function autoSelectScoredRace(races: Race[]): string | null {
  return (
    [...races]
      .filter((r) => r.keySetAt != null)
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.id ?? null
  );
}

export default function WeeklyResultsPage() {
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

  // Keeps an explicit selection when it's still a valid scored race, otherwise
  // falls back to auto-selecting the most recently scored one.
  const effectiveRaceId =
    selectedRaceId && scoredRaces.some((r) => r.id === selectedRaceId)
      ? selectedRaceId
      : autoSelectScoredRace(races);

  const resultsEnabled = enabled && !!effectiveRaceId;
  const resultsQuery = useQuery(
    orpc.weeklyResults.get.queryOptions({
      input: { leagueId: activeLeagueId ?? "", raceId: effectiveRaceId ?? "" },
      enabled: resultsEnabled,
    }),
  );

  const queries = resultsEnabled ? [racesQuery, resultsQuery] : [racesQuery];
  const isPending = queries.some((q) => q.isPending);
  const firstError = queries.find((q) => q.isError);

  return (
    <PageShell title="Weekly Results">
      {userLoading || (enabled && isPending) ? (
        <QueryLoading />
      ) : !activeLeagueId ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">No leagues yet.</p>
      ) : firstError ? (
        <QueryError error={firstError.error} onRetry={() => queries.forEach((q) => q.refetch())} />
      ) : scoredRaces.length === 0 ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          No scored races yet.
        </p>
      ) : (
        <div className="space-y-4">
          <select
            value={effectiveRaceId ?? ""}
            onChange={(e) => setSelectedRaceId(e.target.value)}
          >
            {scoredRaces.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title} ({r.date})
              </option>
            ))}
          </select>

          {resultsQuery.data && (
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Medal</th>
                  <th>Name</th>
                  <th>Grid</th>
                  <th>Prop</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {resultsQuery.data.entries.map((entry) => (
                  <tr key={entry.userId}>
                    <td>{entry.rank}</td>
                    <td>{entry.medal ?? "-"}</td>
                    <td>{entry.name}</td>
                    <td>{entry.gridPoints}</td>
                    <td>{entry.propPoints}</td>
                    <td>{entry.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </PageShell>
  );
}
