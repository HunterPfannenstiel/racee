"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type League, type Motorsport } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LeaguesSection } from "./LeaguesSection";
import { OverhaulNotice } from "@/components/ui/overhaul-notice";

export default function AdminLeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [motorsportId, setMotorsportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/leagues").then((r) => r.json()),
      fetch("/api/motorsports").then((r) => r.json()),
    ]).then(([leagueList, motorsports]: [League[], Motorsport[]]) => {
      setLeagues(leagueList);
      if (motorsports.length > 0) setMotorsportId(motorsports[0].id);
    });
  }, []);

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
      <LeaguesSection leagues={leagues} motorsportId={motorsportId} onLeaguesChange={setLeagues} onError={setError} />
    </PageShell>
  );
}
