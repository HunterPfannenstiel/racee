"use client";

import { useEffect, useState } from "react";
import { type Season, type Racer, type Race } from "@/lib/schemas";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { SeasonsSection } from "@/app/admin/seasons/SeasonsSection";
import { DriversSection } from "@/app/admin/drivers/DriversSection";
import { RacesSection } from "./RacesSection";

type InitData = { seasons: Season[]; racers: Racer[]; races: Race[] };

export default function CreatePage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [racers, setRacers] = useState<Racer[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/create/init")
      .then((res) => res.json())
      .then((data: InitData) => {
        setSeasons(data.seasons);
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

      <SeasonsSection seasons={seasons} onSeasonsChange={setSeasons} onError={setError} />

      <DriversSection racers={racers} onRacersChange={setRacers} onError={setError} />

      <RacesSection
        seasons={seasons}
        races={races}
        racers={racers}
        onRacesChange={setRaces}
        onError={setError}
      />
    </PageShell>
  );
}
