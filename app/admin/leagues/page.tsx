"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type League } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LeaguesSection } from "./LeaguesSection";

export default function AdminLeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leagues")
      .then((r) => r.json())
      .then(setLeagues);
  }, []);

  return (
    <PageShell title="Leagues">
      <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Admin
      </Link>
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>✕</Button>
          </AlertDescription>
        </Alert>
      )}
      <LeaguesSection leagues={leagues} onLeaguesChange={setLeagues} onError={setError} />
    </PageShell>
  );
}
