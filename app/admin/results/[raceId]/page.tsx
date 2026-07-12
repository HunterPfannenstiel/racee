"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { type Race, type Racer, type PropName } from "@/lib/schemas";
import { orpc } from "@/lib/orpc/client";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { KeyEditor } from "../KeyEditor";
import { OverhaulNotice } from "@/components/ui/overhaul-notice";

export default function SetResultPage() {
  const { raceId } = useParams<{ raceId: string }>();
  const router = useRouter();
  const leaguesQuery = useQuery(orpc.leagues.list.queryOptions());
  const [race, setRace] = useState<Race | null>(null);
  const [motorsportId, setMotorsportId] = useState<string | null>(null);
  const [racersById, setRacersById] = useState<Record<string, Racer>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (leaguesQuery.isPending) return;
    if (leaguesQuery.isError) {
      setError("Failed to load race data.");
      setLoading(false);
      return;
    }
    const leagues = leaguesQuery.data ?? [];
    if (leagues.length === 0) {
      setError("Failed to load race data.");
      setLoading(false);
      return;
    }
    const msId = leagues[0].motorsportId;
    setMotorsportId(msId);

    Promise.all([
      fetch(`/api/races?motorsportId=${msId}`).then((r) => r.json() as Promise<Race[]>),
      fetch("/api/racers").then((r) => r.json() as Promise<Racer[]>),
    ])
      .then(([raceList, racerList]) => {
        const found = raceList.find((r) => r.id === raceId) ?? null;
        setRace(found);
        setRacersById(Object.fromEntries(racerList.map((r) => [r.id, r])));
      })
      .catch(() => setError("Failed to load race data."))
      .finally(() => setLoading(false));
  }, [raceId, leaguesQuery.isPending, leaguesQuery.isError, leaguesQuery.data]);

  return (
    <PageShell title="Set Result">
      <Link href="/admin/results" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Results
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
