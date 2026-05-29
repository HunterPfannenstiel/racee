"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { type League, type Race, type Racer, type PropKey, type PropPointValues } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { LeaguePicker } from "@/components/ui/league-picker";
import { RaceSelect } from "@/components/ui/race-select";
import { Spinner } from "@/components/ui/spinner";
import { PicksGrid } from "./PicksGrid";
import { PropChips } from "./PropChips";

type RaceData = {
  prediction: string[] | null;
  key: string[] | null;
  propPicks: Record<string, string>;
  propKey: PropKey | null;
  scores: { gridPoints: number; propPoints: number; medal: string | null } | null;
  rank: number | null;
  totalParticipants: number;
  placementPoints: number[];
  propPointValues: PropPointValues | null;
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

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();

  const [leagues, setLeagues] = useState<League[] | null>(null);
  const [racersById, setRacersById] = useState<Record<string, Racer>>({});
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [races, setRaces] = useState<Race[] | null>(null);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [raceData, setRaceData] = useState<RaceData | null>(null);
  const [loadingRaceData, setLoadingRaceData] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/leagues").then((r) => r.json() as Promise<League[]>),
      fetch("/api/racers").then((r) => r.json() as Promise<Racer[]>),
    ]).then(([ls, rs]) => {
      setLeagues(ls);
      setRacersById(Object.fromEntries(rs.map((r) => [r.id, r])));
    });
  }, []);

  useEffect(() => {
    if (!selectedLeagueId) return;
    setLoadingRaces(true);
    setRaces(null);
    setSelectedRaceId(null);
    setRaceData(null);
    fetch(`/api/races?leagueId=${selectedLeagueId}`)
      .then((r) => r.json() as Promise<Race[]>)
      .then((rs) => { setRaces(rs); setLoadingRaces(false); });
  }, [selectedLeagueId]);

  useEffect(() => {
    if (!selectedLeagueId || !selectedRaceId) return;
    setLoadingRaceData(true);
    setRaceData(null);
    fetch(`/api/profile/race?leagueId=${selectedLeagueId}&raceId=${selectedRaceId}&userId=${userId}`)
      .then((r) => r.json() as Promise<RaceData>)
      .then((d) => { setRaceData(d); setLoadingRaceData(false); });
  }, [selectedLeagueId, selectedRaceId, userId]);

  const driverPoints = raceData?.prediction && raceData.key && raceData.placementPoints.length
    ? computeDriverPoints(raceData.prediction, raceData.key, raceData.placementPoints)
    : null;

  return (
    <PageShell title="Profile">
      {!leagues ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="w-4 h-4" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : leagues.length === 0 ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">No leagues yet.</p>
      ) : (
        <div className="space-y-6">
          <LeaguePicker leagues={leagues} selectedLeagueId={selectedLeagueId} onSelect={setSelectedLeagueId} />
          {loadingRaces ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Spinner className="w-4 h-4" />
              <span className="text-xs tracking-widest uppercase">Loading</span>
            </div>
          ) : races && (
            <RaceSelect races={races} selectedRaceId={selectedRaceId} onSelect={setSelectedRaceId} />
          )}
          {loadingRaceData ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Spinner className="w-4 h-4" />
              <span className="text-xs tracking-widest uppercase">Loading</span>
            </div>
          ) : raceData && !raceData.prediction ? (
            <p className="text-xs tracking-widest uppercase text-muted-foreground">No prediction submitted.</p>
          ) : raceData?.prediction ? (
            <div className="space-y-8">
              {raceData.scores && (
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {raceData.scores.gridPoints + raceData.scores.propPoints} pts
                  </p>
                  <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground list-disc list-inside">
                    <li>{raceData.scores.gridPoints} grid · {raceData.scores.propPoints} prop points</li>
                    {raceData.rank && <li>Placement: {raceData.rank} out of {raceData.totalParticipants}</li>}
                  </ul>
                </div>
              )}
              <PicksGrid
                prediction={raceData.prediction}
                racersById={racersById}
                keyOrder={raceData.key}
                driverPoints={driverPoints}
              />
              <PropChips
                propPicks={raceData.propPicks}
                propKey={raceData.propKey}
                racersById={racersById}
                propPointValues={raceData.propPointValues}
              />
            </div>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}
