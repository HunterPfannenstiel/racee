"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type League } from "@/lib/schemas";
import { orpc } from "@/lib/orpc/client";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LeaguesSection } from "./LeaguesSection";
import { OverhaulNotice } from "@/components/ui/overhaul-notice";

export default function AdminLeaguesPage() {
  const queryClient = useQueryClient();
  const { data: leagues = [] } = useQuery(orpc.leagues.list.queryOptions());
  const { data: motorsports = [] } = useQuery(orpc.motorsports.list.queryOptions());
  const motorsportId = motorsports[0]?.id ?? null;
  const [error, setError] = useState<string | null>(null);

  function handleLeaguesChange(next: League[]) {
    queryClient.setQueryData(orpc.leagues.list.queryKey(), next);
  }

  return (
    <PageShell title="Leagues">
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
      <LeaguesSection leagues={leagues} motorsportId={motorsportId} onLeaguesChange={handleLeaguesChange} onError={setError} />
    </PageShell>
  );
}
