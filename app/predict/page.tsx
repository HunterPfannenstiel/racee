"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/context/UserContext";
import { Season, Race, Racer, Prediction } from "@/lib/schemas";
import { RequireUser } from "@/components/RequireUser";
import { SeasonSelector } from "./SeasonSelector";
import { RaceSelector } from "./RaceSelector";
import { PredictionForm } from "./PredictionForm";

type InitData = {
  seasons: Season[];
  races: Race[];
  racersById: Record<string, Racer>;
  predictions: Record<string, Prediction>;
  keys: Record<string, Prediction>;
};

export default function PredictPage() {
  const { user } = useUser();
  const [data, setData] = useState<InitData | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/predict/init?userId=${user.id}`)
      .then((r) => r.json())
      .then(setData);
  }, [user]);

  const seasonRaces = selectedSeasonId && data
    ? data.races.filter((r) => r.seasonId === selectedSeasonId)
    : [];
  const selectedRace = data?.races.find((r) => r.id === selectedRaceId) ?? null;

  function handleSeasonSelect(seasonId: string) {
    setSelectedSeasonId(seasonId);
    setSelectedRaceId(null);
  }

  function handlePredictionSave(prediction: Prediction) {
    setData((prev) =>
      prev
        ? { ...prev, predictions: { ...prev.predictions, [prediction.raceId]: prediction } }
        : prev
    );
  }

  return (
    <RequireUser>
      {!data ? (
        <div>Loading...</div>
      ) : data.seasons.length === 0 ? (
        <div>No seasons yet.</div>
      ) : (
        <div>
          {error && <div>{error}</div>}
          <SeasonSelector
            seasons={data.seasons}
            selectedSeasonId={selectedSeasonId}
            onSelect={handleSeasonSelect}
          />
          {selectedSeasonId && (
            <RaceSelector
              races={seasonRaces}
              selectedRaceId={selectedRaceId}
              onSelect={setSelectedRaceId}
            />
          )}
          {selectedRace && (
            <PredictionForm
              key={selectedRaceId}
              race={selectedRace}
              racersById={data.racersById}
              existingPrediction={data.predictions[selectedRace.id] ?? null}
              existingKey={data.keys[selectedRace.id] ?? null}
              onSave={handlePredictionSave}
              onError={setError}
            />
          )}
        </div>
      )}
    </RequireUser>
  );
}
