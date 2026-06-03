"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, notFound } from "next/navigation";
import { type PropKey, type PropPointValues } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { Spinner } from "@/components/ui/spinner";
import { PicksGrid } from "./PicksGrid";
import { PropRows } from "./PropRows";
import { PicksHero } from "./PicksHero";
import type { RacerDTO } from "@/server/queries/user-race-picks/IUserRacePicksQuery";

type RaceData = {
  race: { title: string; label?: string } | null;
  prediction: string[] | null;
  key: string[] | null;
  propPicks: Record<string, string>;
  propKey: PropKey | null;
  scores: { gridPoints: number; propPoints: number; medal: string | null } | null;
  rank: number | null;
  totalParticipants: number;
  placementPoints: number[];
  propPointValues: PropPointValues | null;
  racersById: Record<string, RacerDTO>;
};

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

  const [raceData, setRaceData] = useState<RaceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setRaceData(null);
    fetch(`/api/profile/race?leagueId=${leagueId}&raceId=${raceId}&userId=${userId}`)
      .then((r) => r.json() as Promise<RaceData>)
      .then((d) => { setRaceData(d); setLoading(false); });
  }, [leagueId, raceId, userId]);

  const driverPoints = raceData?.prediction && raceData.key && raceData.placementPoints.length
    ? computeDriverPoints(raceData.prediction, raceData.key, raceData.placementPoints)
    : null;

  return (
    <PageShell title="Picks">
      {loading ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="w-4 h-4" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : !raceData?.prediction ? (
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
