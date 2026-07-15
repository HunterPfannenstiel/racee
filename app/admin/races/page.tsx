"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { QueryLoading, QueryError } from "@/components/ui/query-state";
import { RacesSection } from "./RacesSection";
import { OverhaulNotice } from "@/components/ui/overhaul-notice";

export default function AdminRacesPage() {
  const [error, setError] = useState<string | null>(null);

  const racersQuery = useQuery(orpc.racers.list.queryOptions());
  const motorsportsQuery = useQuery(orpc.motorsports.list.queryOptions());

  const motorsportId = motorsportsQuery.data?.[0]?.id ?? null;

  const racesQuery = useQuery(
    orpc.races.list.queryOptions({
      input: { motorsportId: motorsportId ?? "" },
      enabled: !!motorsportId,
    }),
  );

  const racers = racersQuery.data ?? [];
  const races = racesQuery.data ?? [];

  const pending = racersQuery.isPending || motorsportsQuery.isPending || (!!motorsportId && racesQuery.isPending);
  const firstError = racersQuery.isError
    ? racersQuery.error
    : motorsportsQuery.isError
      ? motorsportsQuery.error
      : racesQuery.isError
        ? racesQuery.error
        : null;

  return (
    <PageShell title="Races">
      <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Admin
      </Link>
      <OverhaulNotice />

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
            motorsportsQuery.refetch();
            racesQuery.refetch();
          }}
        />
      ) : !motorsportId ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          No motorsports configured.
        </p>
      ) : (
        <RacesSection
          motorsportId={motorsportId}
          races={races}
          racers={racers}
          onError={setError}
        />
      )}
    </PageShell>
  );
}
