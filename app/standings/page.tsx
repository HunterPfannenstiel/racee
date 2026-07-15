"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/ui/page-shell";
import { QueryError } from "@/components/ui/query-state";
import { useUser } from "@/app/context/UserContext";
import { useLeague } from "@/app/context/LeagueContext";
import { orpc } from "@/lib/orpc/client";
import { StandingsGrid } from "./StandingsGrid";

export default function ViewPage() {
  const { user, isLoading: userLoading } = useUser();
  const { activeLeagueId } = useLeague();
  const enabled = !!user && !!activeLeagueId;
  const leagueInput = { leagueId: activeLeagueId ?? "" };

  const leagueQuery = useQuery(orpc.leagues.get.queryOptions({ input: leagueInput, enabled }));
  const teamsQuery = useQuery(orpc.leagues.teams.list.queryOptions({ input: leagueInput, enabled }));
  const racesQuery = useQuery(orpc.races.list.queryOptions({ input: leagueInput, enabled }));
  const standingsQuery = useQuery(orpc.standings.get.queryOptions({ input: leagueInput, enabled }));

  const queries = [leagueQuery, teamsQuery, racesQuery, standingsQuery];
  const isPending = queries.some((q) => q.isPending);
  const firstError = queries.find((q) => q.isError);

  // The legacy init payload returned races date-sorted; races.list doesn't
  // sort, and the stage arrays reference raceIds positionally, so the same
  // ordering must be re-established here.
  const sortedRaces = useMemo(
    () => (racesQuery.data ? [...racesQuery.data].sort((a, b) => a.date.localeCompare(b.date)) : []),
    [racesQuery.data],
  );

  return (
    <PageShell title="Standings">
      {userLoading || (enabled && isPending && !firstError) ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : !activeLeagueId ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">No leagues yet.</p>
      ) : firstError ? (
        <QueryError error={firstError.error} onRetry={() => queries.forEach((q) => q.refetch())} />
      ) : leagueQuery.data && teamsQuery.data && standingsQuery.data ? (
        <StandingsGrid
          league={leagueQuery.data}
          races={sortedRaces}
          usersById={standingsQuery.data.usersById}
          teams={teamsQuery.data}
          driverRows={standingsQuery.data.driverRows}
          constructorRows={standingsQuery.data.constructorRows}
          stages={standingsQuery.data.stages}
        />
      ) : null}
    </PageShell>
  );
}
