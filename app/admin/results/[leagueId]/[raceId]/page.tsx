"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { type Race, type Racer, type PropName } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { KeyEditor } from "../../KeyEditor";

export default function SetResultPage() {
  const { leagueId, raceId } = useParams<{ leagueId: string; raceId: string }>();
  const router = useRouter();
  const [race, setRace] = useState<Race | null>(null);
  const [racersById, setRacersById] = useState<Record<string, Racer>>({});
  const [existingKey, setExistingKey] = useState<string[] | null>(null);
  const [keySetAt, setKeySetAt] = useState<string | null>(null);
  const [existingPropKey, setExistingPropKey] = useState<Partial<Record<PropName, string[] | null>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/races?leagueId=${leagueId}`).then((r) => r.json() as Promise<Race[]>),
      fetch("/api/racers").then((r) => r.json() as Promise<Racer[]>),
      fetch(`/api/races/key?leagueId=${leagueId}&raceId=${raceId}`).then((r) => r.json() as Promise<{ key: string[] | null; keySetAt: string | null; propKey: Partial<Record<PropName, string[] | null>> | null }>),
    ])
      .then(([races, racerList, keyMeta]) => {
        const found = races.find((r) => r.id === raceId) ?? null;
        setRace(found);
        setRacersById(Object.fromEntries(racerList.map((r) => [r.id, r])));
        setExistingKey(keyMeta.key);
        setKeySetAt(keyMeta.keySetAt);
        setExistingPropKey(keyMeta.propKey ?? {});
      })
      .catch(() => setError("Failed to load race data."))
      .finally(() => setLoading(false));
  }, [leagueId, raceId]);

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
        <div className="space-y-4">
          {keySetAt && (
            <p className="text-xs text-muted-foreground">
              Key last set {new Date(Number(keySetAt)).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}.
            </p>
          )}
          <KeyEditor
            race={race}
            leagueId={leagueId}
            racersById={racersById}
            existingKey={existingKey}
            existingPropKey={existingPropKey}
            onSave={() => router.push("/admin/results")}
            onCancel={() => router.push("/admin/results")}
            onError={setError}
          />
        </div>
      )}
    </PageShell>
  );
}
