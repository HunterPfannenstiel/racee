"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { QueryLoading, QueryError } from "@/components/ui/query-state";
import { LeaguesSection } from "@/app/admin/leagues/LeaguesSection";
import { DriversSection } from "@/app/admin/drivers/DriversSection";
import { RacesSection } from "./RacesSection";

export default function CreatePage() {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const racersQuery = useQuery(orpc.racers.list.queryOptions());
  const leaguesQuery = useQuery(orpc.leagues.listAll.queryOptions());
  const motorsportsQuery = useQuery(orpc.motorsports.list.queryOptions());

  const motorsportId = motorsportsQuery.data?.[0]?.id ?? null;

  const racesQuery = useQuery(
    orpc.races.list.queryOptions({
      input: { motorsportId: motorsportId ?? "" },
      enabled: !!motorsportId,
    }),
  );

  const racers = racersQuery.data ?? [];
  const leagues = leaguesQuery.data ?? [];
  const races = racesQuery.data ?? [];

  const pending = racersQuery.isPending || leaguesQuery.isPending || motorsportsQuery.isPending;
  const firstError = racersQuery.isError
    ? racersQuery.error
    : leaguesQuery.isError
      ? leaguesQuery.error
      : motorsportsQuery.isError
        ? motorsportsQuery.error
        : null;

  return (
    <PageShell title="Create">
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>✕</Button>
          </AlertDescription>
        </Alert>
      )}

      {pending ? (
        <QueryLoading />
      ) : firstError ? (
        <QueryError
          error={firstError}
          onRetry={() => {
            racersQuery.refetch();
            leaguesQuery.refetch();
            motorsportsQuery.refetch();
          }}
        />
      ) : (
        <>
          <LeaguesSection
            leagues={leagues}
            motorsportId={motorsportId}
            onLeaguesChange={() => queryClient.invalidateQueries({ queryKey: orpc.leagues.listAll.key() })}
            onError={setError}
          />

          <DriversSection racers={racers} motorsportId={motorsportId} onError={setError} />

          <RacesSection
            motorsportId={motorsportId}
            races={races}
            racers={racers}
            onError={setError}
          />
        </>
      )}
    </PageShell>
  );
}
