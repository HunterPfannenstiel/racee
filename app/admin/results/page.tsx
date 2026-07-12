"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { OverhaulNotice } from "@/components/ui/overhaul-notice";

export default function AdminResultsPage() {
  const queryClient = useQueryClient();
  const leaguesQuery = useQuery(orpc.leagues.list.queryOptions());
  const motorsportId = leaguesQuery.data?.[0]?.motorsportId ?? null;
  const racesQuery = useQuery(
    orpc.races.list.queryOptions({
      input: { motorsportId: motorsportId ?? "" },
      enabled: !!motorsportId,
    }),
  );
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [dismissedLoadError, setDismissedLoadError] = useState(false);

  const recalculateMutation = useMutation(
    orpc.races.recalculate.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.races.list.key() }),
    }),
  );

  async function handleRecalculate(raceId: string) {
    if (!motorsportId) return;
    setMutationError(null);
    try {
      await recalculateMutation.mutateAsync({ motorsportId, raceId });
    } catch {
      setMutationError("Recalculate failed.");
    }
  }

  const loading = leaguesQuery.isPending || (!!motorsportId && racesQuery.isPending);
  const races = racesQuery.data ?? [];
  const recalculatingId = recalculateMutation.isPending ? (recalculateMutation.variables?.raceId ?? null) : null;
  const loadFailed = leaguesQuery.isError || racesQuery.isError;
  const error = mutationError ?? (loadFailed && !dismissedLoadError ? "Failed to load data." : null);

  return (
    <PageShell title="Results">
      <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Admin
      </Link>
      <OverhaulNotice />

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMutationError(null);
                setDismissedLoadError(true);
              }}
            >
              ✕
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="w-4 h-4" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : races.length === 0 ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">No races yet.</p>
      ) : (
        <div className="space-y-8">
          {(() => {
            const today = new Date().toISOString().split("T")[0];
            const asc = (a: typeof races[number], b: typeof races[number]) => a.date.localeCompare(b.date);
            const desc = (a: typeof races[number], b: typeof races[number]) => b.date.localeCompare(a.date);

            const awaiting = races.filter((r) => r.date < today && !r.keySetAt).sort(desc);
            const upcoming = races.filter((r) => r.date >= today && !r.keySetAt).sort(asc);
            const graded = races.filter((r) => r.keySetAt).sort(desc);

            const sections = [
              { label: "Awaiting Result", races: awaiting },
              { label: "Upcoming", races: upcoming },
              { label: "Graded", races: graded },
            ].filter((s) => s.races.length > 0);

            return sections.map(({ label, races: sectionRaces }) => (
              <section key={label} className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {sectionRaces.map((race) => {
                    const isGraded = !!race.keySetAt;
                    const isRecalculating = recalculatingId === race.id;
                    return (
                      <Card key={race.id} size="sm" className="flex flex-col gap-3 px-4 py-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{race.title}</p>
                          <p className="text-xs text-muted-foreground">{race.date}</p>
                          {isGraded && race.keySetAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Set {new Date(Number(race.keySetAt)).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                        {isGraded ? (
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={recalculateMutation.isPending}
                              onClick={() => handleRecalculate(race.id)}
                              className="flex-1"
                            >
                              {isRecalculating && <Spinner className="size-3 mr-1" />}
                              Recalculate
                            </Button>
                            <Link
                              href={`/admin/results/${race.id}`}
                              className="inline-flex items-center justify-center h-7 px-2.5 text-[0.8rem] font-medium rounded-[min(var(--radius-md),12px)] border border-border bg-background hover:bg-muted hover:text-foreground transition-colors shrink-0"
                            >
                              Edit
                            </Link>
                          </div>
                        ) : (
                          <Link
                            href={`/admin/results/${race.id}`}
                            className="inline-flex items-center justify-center w-full h-8 px-3 text-xs font-medium rounded-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            Set Result
                          </Link>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </section>
            ));
          })()}
        </div>
      )}
    </PageShell>
  );
}
