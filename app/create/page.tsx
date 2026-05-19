"use client";

import { useEffect, useState } from "react";
import { type League, type Racer, type Race } from "@/lib/schemas";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { LeaguesSection } from "@/app/admin/leagues/LeaguesSection";
import { DriversSection } from "@/app/admin/drivers/DriversSection";
import { RacesSection } from "./RacesSection";

type InitData = { leagues: League[]; racers: Racer[]; races: Race[] };

export default function CreatePage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [racers, setRacers] = useState<Racer[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/create/init")
      .then((res) => res.json())
      .then((data: InitData) => {
        setLeagues(data.leagues);
        setRacers(data.racers);
        setRaces(data.races);
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

      <LeaguesSection leagues={leagues} onLeaguesChange={setLeagues} onError={setError} />

      <DriversSection racers={racers} onRacersChange={setRacers} onError={setError} />

      <RacesSection
        leagues={leagues}
        races={races}
        racers={racers}
        onRacesChange={setRaces}
        onError={setError}
      />
    </PageShell>
  );
}
