"use client";

import { useEffect, useState } from "react";
import { type Racer, type PropName } from "@/lib/schemas";
import { useUser } from "@/app/context/UserContext";

export type LineupEditorPlayer = {
  id: string;
  name: string;
  avatarUrl?: string;
  teamColor?: string;
};

export type LineupEditorRace = {
  id: string;
  title: string;
  date: string;
  startingGrid: string[];
};

type RacePrediction = {
  racerIds: string[];
  propPicks: Partial<Record<PropName, string>>;
  submittedAt: string | null;
  submittedByName: string | null;
};

function pickDefaultRaceId(races: LineupEditorRace[]): string | null {
  if (races.length === 0) return null;
  const today = new Date().toISOString().split("T")[0];
  const past = races.filter((r) => r.date <= today).sort((a, b) => b.date.localeCompare(a.date));
  if (past.length > 0) return past[0].id;
  return [...races].sort((a, b) => a.date.localeCompare(b.date))[0].id;
}

export function useLineupEditor(leagueId: string, userId: string) {
  const { user } = useUser();
  const [player, setPlayer] = useState<LineupEditorPlayer>({ id: userId, name: "" });
  const [races, setRaces] = useState<LineupEditorRace[]>([]);
  const [racersById, setRacersById] = useState<Record<string, Racer>>({});
  const [predictions, setPredictions] = useState<Record<string, RacePrediction>>({});
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`/api/commissioner/leagues/${leagueId}/players`).then((r) => r.json()),
      fetch(`/api/commissioner/leagues/${leagueId}/players/${userId}/predictions`).then((r) => r.json()),
    ]).then(([playersData, predictionsData]) => {
      if (cancelled) return;

      const allPlayers = [...(playersData.members ?? []), ...(playersData.pending ?? [])] as {
        id: string;
        name: string;
      }[];
      const nameById = new Map(allPlayers.map((p) => [p.id, p.name]));
      if (user) nameById.set(user.id, "You");

      const target = allPlayers.find((p) => p.id === userId);
      setPlayer({ id: userId, name: target?.name ?? "" });
      setRacersById(predictionsData.racersById ?? {});

      const apiRaces: {
        id: string;
        title: string;
        date: string;
        startingGrid: string[];
        prediction: {
          racerIds: string[];
          propPicks: Partial<Record<PropName, string>>;
          submittedAt: string | null;
          submittedBy: string | null;
        } | null;
      }[] = predictionsData.races ?? [];

      const nextRaces: LineupEditorRace[] = apiRaces.map((r) => ({
        id: r.id,
        title: r.title,
        date: r.date,
        startingGrid: r.startingGrid,
      }));

      const nextPredictions: Record<string, RacePrediction> = {};
      for (const r of apiRaces) {
        if (!r.prediction) continue;
        nextPredictions[r.id] = {
          racerIds: r.prediction.racerIds,
          propPicks: r.prediction.propPicks,
          submittedAt: r.prediction.submittedAt,
          submittedByName: r.prediction.submittedBy ? nameById.get(r.prediction.submittedBy) ?? null : null,
        };
      }

      setRaces(nextRaces);
      setPredictions(nextPredictions);
      setSelectedRaceId((current) => current ?? pickDefaultRaceId(nextRaces));
    });

    return () => {
      cancelled = true;
    };
  }, [leagueId, userId, user]);

  async function saveRacePrediction(
    raceId: string,
    racerIds: string[],
    propPicks: Partial<Record<PropName, string>>,
  ) {
    setSaving(true);
    try {
      const res = await fetch(`/api/commissioner/leagues/${leagueId}/players/${userId}/predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raceId, racerIds, propPicks }),
      });
      if (!res.ok) return;
      setPredictions((prev) => ({
        ...prev,
        [raceId]: {
          racerIds,
          propPicks,
          submittedAt: new Date().toISOString(),
          submittedByName: "You",
        },
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return {
    player,
    races,
    racersById,
    predictions,
    selectedRaceId,
    setSelectedRaceId,
    saveRacePrediction,
    saving,
    saved,
  };
}
