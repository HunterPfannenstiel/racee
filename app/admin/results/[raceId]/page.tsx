"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { type Racer, type PropName } from "@/lib/schemas";
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
  const racersQuery = useQuery(orpc.racers.list.queryOptions());
  const [mutationError, setMutationError] = useState<string | null>(null);

  const leagues = leaguesQuery.data ?? [];
  const motorsportId = leagues[0]?.motorsportId ?? null;

  const racesQuery = useQuery(
    orpc.races.list.queryOptions({
      input: { motorsportId: motorsportId ?? "" },
      enabled: !!motorsportId,
    }),
  );

  const loading = leaguesQuery.isPending || racersQuery.isPending || (!!motorsportId && racesQuery.isPending);
  const loadFailed =
    leaguesQuery.isError ||
    racesQuery.isError ||
    (leaguesQuery.isSuccess && leagues.length === 0);

  const race = (racesQuery.data ?? []).find((r) => r.id === raceId) ?? null;
  const error = loadFailed ? "Failed to load race data." : mutationError;

  const racersById: Record<string, Racer> = Object.fromEntries(
    (racersQuery.data ?? []).map((r) => [r.id, r]),
  );

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
            <Button variant="ghost" size="sm" onClick={() => setMutationError(null)}>✕</Button>
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
            onError={setMutationError}
          />
        </div>
      )}
    </PageShell>
  );
}
