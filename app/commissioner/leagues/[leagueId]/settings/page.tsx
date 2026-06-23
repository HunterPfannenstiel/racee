"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { type League } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LeagueConfigSection } from "../LeagueConfigSection";
import { OverhaulNotice } from "@/components/ui/overhaul-notice";
import { ConnectedCoCommissioner } from "@/app/commissioner/co-commissioner/ConnectedCoCommissioner";

export default function CommissionerLeagueSettingsPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [league, setLeague] = useState<League | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/commissioner/leagues/${leagueId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load league.");
        return r.json();
      })
      .then(setLeague)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load league."));
  }, [leagueId]);

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
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>✕</Button>
          </AlertDescription>
        </Alert>
      )}
      {league && (
        <>
          <LeagueConfigSection
            leagueId={leagueId}
            league={league}
            onLeagueChange={setLeague}
            onError={setError}
          />
          <ConnectedCoCommissioner leagueId={leagueId} />
        </>
      )}
    </PageShell>
  );
}
