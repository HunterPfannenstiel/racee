"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type Racer } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DriversSection } from "./DriversSection";

export default function AdminDriversPage() {
  const [racers, setRacers] = useState<Racer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/racers")
      .then((r) => r.json())
      .then(setRacers);
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
      <DriversSection racers={racers} onRacersChange={setRacers} onError={setError} />
    </PageShell>
  );
}
