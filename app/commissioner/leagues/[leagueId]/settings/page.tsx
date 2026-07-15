"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { QueryLoading } from "@/components/ui/query-state";
import { orpc } from "@/lib/orpc/client";
import { LeagueConfigSection } from "../LeagueConfigSection";
import { OverhaulNotice } from "@/components/ui/overhaul-notice";
import { ConnectedCoCommissioner } from "@/app/commissioner/co-commissioner/ConnectedCoCommissioner";
import { ConnectedInviteLink } from "@/app/commissioner/invite-link/ConnectedInviteLink";

export default function CommissionerLeagueSettingsPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [error, setError] = useState<string | null>(null);

  const leagueQuery = useQuery(orpc.leagues.get.queryOptions({ input: { leagueId } }));
  const league = leagueQuery.data;

  return (
    <PageShell title="League Settings">
      <Link
        href={`/commissioner/leagues/${leagueId}`}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft className="size-3.5" />
        {league?.name ?? "League"}
      </Link>
      <OverhaulNotice />
      {(error ?? leagueQuery.isError) && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error ?? "Failed to load league."}
            {error && (
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>✕</Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      {leagueQuery.isPending && <QueryLoading />}
      {league && (
        <>
          <LeagueConfigSection leagueId={leagueId} league={league} onError={setError} />
          <ConnectedInviteLink leagueId={leagueId} />
          <ConnectedCoCommissioner leagueId={leagueId} />
        </>
      )}
    </PageShell>
  );
}
