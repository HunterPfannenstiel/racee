"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { type League } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LeagueConfigSection } from "./LeagueConfigSection";

export default function CommissionerLeaguePage() {
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
      .catch((e) => setError(e.message));
  }, [leagueId]);

  return (
    <PageShell title={league?.name ?? "League"}>
      <Link href="/commissioner" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Commissioner
      </Link>
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>✕</Button>
          </AlertDescription>
        </Alert>
      )}
      {league && (
        <LeagueConfigSection
          leagueId={leagueId}
          league={league}
          onLeagueChange={setLeague}
          onError={setError}
        />
      )}
    </PageShell>
  );
}
