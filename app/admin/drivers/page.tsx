"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type Racer, type Motorsport } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DriversSection } from "./DriversSection";

export default function AdminDriversPage() {
  const [racers, setRacers] = useState<Racer[]>([]);
  const [motorsportId, setMotorsportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/racers").then((r) => r.json()),
      fetch("/api/motorsports").then((r) => r.json()),
    ]).then(([racerList, motorsports]: [Racer[], Motorsport[]]) => {
      setRacers(racerList);
      if (motorsports.length > 0) setMotorsportId(motorsports[0].id);
    });
  }, []);

  return (
    <PageShell title="Drivers">
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
      <DriversSection racers={racers} motorsportId={motorsportId} onRacersChange={setRacers} onError={setError} />
    </PageShell>
  );
}
