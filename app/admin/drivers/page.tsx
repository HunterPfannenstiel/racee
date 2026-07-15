"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { QueryLoading, QueryError } from "@/components/ui/query-state";
import { DriversSection } from "./DriversSection";
import { OverhaulNotice } from "@/components/ui/overhaul-notice";

export default function AdminDriversPage() {
  const [error, setError] = useState<string | null>(null);

  const racersQuery = useQuery(orpc.racers.list.queryOptions());
  const motorsportsQuery = useQuery(orpc.motorsports.list.queryOptions());

  const motorsportId = motorsportsQuery.data?.[0]?.id ?? null;

  return (
    <PageShell title="Drivers">
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
      {racersQuery.isPending || motorsportsQuery.isPending ? (
        <QueryLoading />
      ) : racersQuery.isError ? (
        <QueryError error={racersQuery.error} onRetry={() => racersQuery.refetch()} />
      ) : motorsportsQuery.isError ? (
        <QueryError error={motorsportsQuery.error} onRetry={() => motorsportsQuery.refetch()} />
      ) : (
        <DriversSection racers={racersQuery.data} motorsportId={motorsportId} onError={setError} />
      )}
    </PageShell>
  );
}
