"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type Season } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SeasonsSection } from "./SeasonsSection";

export default function AdminSeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/seasons")
      .then((r) => r.json())
      .then(setSeasons);
  }, []);

  return (
    <PageShell title="Seasons">
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
      <SeasonsSection seasons={seasons} onSeasonsChange={setSeasons} onError={setError} />
    </PageShell>
  );
}
