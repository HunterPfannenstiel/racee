"use client";

import { useEffect, useState } from "react";
import { type League, type Racer, type Race, type Motorsport } from "@/lib/schemas";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { LeaguesSection } from "@/app/admin/leagues/LeaguesSection";
import { DriversSection } from "@/app/admin/drivers/DriversSection";
import { RacesSection } from "./RacesSection";

type InitRacer = { racerId: string; name: string; constructorName: string; motorsportId: string; image?: string; teamColor?: string };
type CreateInitEntry = { leagueId: string; motorsportId: string; name: string; racers: InitRacer[] };

export default function CreatePage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [racers, setRacers] = useState<Racer[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [motorsportId, setMotorsportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/create/init").then((res) => res.json()),
      fetch("/api/motorsports").then((res) => res.json()),
    ]).then(([initData, motorsports]: [CreateInitEntry[], Motorsport[]]) => {
      if (motorsports.length > 0) setMotorsportId(motorsports[0].id);

      // Flatten per-league init data into the flat shapes the child components expect
      const allLeagues: League[] = initData.map((d) => ({
        id: d.leagueId,
        name: d.name,
        motorsportId: d.motorsportId,
        placementPoints: [],
        mulliganCount: 0,
        propPointValues: { driverOfDay: 0, lapsLed: 0, fastestPitStop: 0, fastestLap: 0, overAchiever: 0, underAchiever: 0, wrecker: 0 },
      }));
      const allRacers: Racer[] = (initData[0]?.racers ?? []).map((r) => ({
        id: r.racerId,
        name: r.name,
        team: r.constructorName,
        motorsportId: r.motorsportId,
        image: r.image,
        teamColor: r.teamColor,
      }));
      setLeagues(allLeagues);
      setRacers(allRacers);

      // Load global races
      if (motorsports.length > 0) {
        fetch(`/api/races?motorsportId=${motorsports[0].id}`)
          .then((res) => res.json())
          .then((globalRaces: Race[]) => {
            setRaces(globalRaces);
          });
      }
    });
  }, []);

  return (
    <PageShell title="Create">
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>✕</Button>
          </AlertDescription>
        </Alert>
      )}

      <LeaguesSection leagues={leagues} motorsportId={motorsportId} onLeaguesChange={setLeagues} onError={setError} />

      <DriversSection racers={racers} motorsportId={motorsportId} onRacersChange={setRacers} onError={setError} />

      <RacesSection
        motorsportId={motorsportId}
        races={races}
        racers={racers}
        onRacesChange={setRaces}
        onError={setError}
      />
    </PageShell>
  );
}
