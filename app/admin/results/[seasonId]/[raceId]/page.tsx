"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { type Race, type Racer } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { KeyEditor } from "../../KeyEditor";

export default function SetResultPage() {
  const { seasonId, raceId } = useParams<{ seasonId: string; raceId: string }>();
  const router = useRouter();
  const [race, setRace] = useState<Race | null>(null);
  const [racersById, setRacersById] = useState<Record<string, Racer>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/races?seasonId=${seasonId}`).then((r) => r.json() as Promise<Race[]>),
      fetch("/api/racers").then((r) => r.json() as Promise<Racer[]>),
    ])
      .then(([races, racerList]) => {
        const found = races.find((r) => r.id === raceId) ?? null;
        setRace(found);
        setRacersById(Object.fromEntries(racerList.map((r) => [r.id, r])));
      })
      .catch(() => setError("Failed to load race data."))
      .finally(() => setLoading(false));
  }, [seasonId, raceId]);

  return (
    <PageShell title="Set Result">
      <Link href="/admin/results" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Results
      </Link>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>✕</Button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="w-4 h-4" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : !race ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">Race not found.</p>
      ) : (
        <KeyEditor
          race={race}
          racersById={racersById}
          onSave={() => router.push("/admin/results")}
          onCancel={() => router.push("/admin/results")}
          onError={setError}
        />
      )}
    </PageShell>
  );
}
