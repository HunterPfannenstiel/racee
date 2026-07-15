"use client";

import { useParams, useSearchParams, notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { PageShell } from "@/components/ui/page-shell";
import { QueryLoading, QueryError } from "@/components/ui/query-state";
import { PicksGrid } from "./PicksGrid";
import { PropRows } from "./PropRows";
import { PicksHero } from "./PicksHero";

function computeDriverPoints(
  prediction: string[],
  key: string[],
  placementPoints: number[],
): Record<string, number> {
  const result: Record<string, number> = {};
  for (let keyPos = 0; keyPos < key.length; keyPos++) {
    const racerId = key[keyPos];
    const userPos = prediction.indexOf(racerId);
    if (userPos === -1) continue;
    const diff = Math.abs(keyPos - userPos);
    result[racerId] = diff < placementPoints.length ? placementPoints[diff] : 0;
  }
  return result;
}

export default function PicksPage() {
  const { userId } = useParams<{ userId: string }>();
  const searchParams = useSearchParams();
  const leagueId = searchParams.get("leagueId");
  const raceId = searchParams.get("raceId");

  if (!leagueId || !raceId) notFound();

  const racePicksQuery = useQuery(
    orpc.predictions.racePicks.queryOptions({
      input: { leagueId, raceId, userId },
    }),
  );

  if (racePicksQuery.isPending) {
    return (
      <PageShell title="Picks">
        <QueryLoading />
      </PageShell>
    );
  }

  if (racePicksQuery.isError) {
    return (
      <PageShell title="Picks">
        <QueryError error={racePicksQuery.error} onRetry={() => racePicksQuery.refetch()} />
      </PageShell>
    );
  }

  const raceData = racePicksQuery.data;
  const driverPoints = raceData.prediction && raceData.key && raceData.placementPoints.length
    ? computeDriverPoints(raceData.prediction, raceData.key, raceData.placementPoints)
    : null;

  return (
    <PageShell title="Picks">
      {!raceData.prediction ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">No prediction submitted.</p>
      ) : (
        <div className="space-y-8">
          {raceData.race && (
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-heading text-xl font-bold text-primary leading-tight">
                {raceData.race.title}
                {raceData.race.label && (
                  <span className="text-secondary"> · {raceData.race.label}</span>
                )}
              </h2>
              <span className="shrink-0 text-xs font-mono uppercase text-secondary border border-border rounded px-2 py-0.5">
                Finished
              </span>
            </div>
          )}
          {raceData.scores && (
            <PicksHero
              totalPoints={raceData.scores.gridPoints + raceData.scores.propPoints}
              rank={raceData.rank}
              totalParticipants={raceData.totalParticipants}
              gridPoints={raceData.scores.gridPoints}
              propPoints={raceData.scores.propPoints}
            />
          )}
          <PicksGrid
            prediction={raceData.prediction}
            racersById={raceData.racersById}
            keyOrder={raceData.key}
            driverPoints={driverPoints}
          />
          <PropRows
            propPicks={raceData.propPicks}
            propKey={raceData.propKey}
            racersById={raceData.racersById}
            propPointValues={raceData.propPointValues}
          />
        </div>
      )}
    </PageShell>
  );
}
