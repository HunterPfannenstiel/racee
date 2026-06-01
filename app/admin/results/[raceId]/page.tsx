"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { type League, type Race, type Racer, type PropName } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { KeyEditor } from "../KeyEditor";

export default function SetResultPage() {
  const { raceId } = useParams<{ raceId: string }>();
  const router = useRouter();
  const [race, setRace] = useState<Race | null>(null);
  const [motorsportId, setMotorsportId] = useState<string | null>(null);
  const [racersById, setRacersById] = useState<Record<string, Racer>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leagues")
      .then((r) => r.json())
      .then(async (leagues: League[]) => {
        if (leagues.length === 0) throw new Error("No leagues");
        const msId = leagues[0].motorsportId;
        setMotorsportId(msId);

        const [raceList, racerList] = await Promise.all([
          fetch(`/api/races?motorsportId=${msId}`).then((r) => r.json() as Promise<Race[]>),
          fetch("/api/racers").then((r) => r.json() as Promise<Racer[]>),
        ]);

        const found = raceList.find((r) => r.id === raceId) ?? null;
        setRace(found);
        setRacersById(Object.fromEntries(racerList.map((r) => [r.id, r])));
      })
      .catch(() => setError("Failed to load race data."))
      .finally(() => setLoading(false));
  }, [raceId]);

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
      ) : !race || !motorsportId ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">Race not found.</p>
      ) : (
        <div className="space-y-4">
          {race.keySetAt && (
            <p className="text-xs text-muted-foreground">
              Key last set {new Date(Number(race.keySetAt)).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}.
            </p>
          )}
          <KeyEditor
            race={race}
            motorsportId={motorsportId}
            racersById={racersById}
            existingKey={race.keyOrder ?? null}
            existingPropKey={(race.propKey as Partial<Record<PropName, string[] | null>>) ?? {}}
            onSave={() => router.push("/admin/results")}
            onCancel={() => router.push("/admin/results")}
            onError={setError}
          />
        </div>
      )}
    </PageShell>
  );
}
