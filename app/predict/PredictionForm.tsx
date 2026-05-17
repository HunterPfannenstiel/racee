"use client";

import { useState } from "react";
import { type Race, type Racer, type Prediction } from "@/lib/schemas";
import { useUser } from "@/app/context/UserContext";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { RacerAvatar } from "@/components/RacerAvatar";

type Props = {
  race: Race;
  racersById: Record<string, Racer>;
  existingPrediction: Prediction | null;
  onSave: (prediction: Prediction) => void;
  onError: (msg: string) => void;
};

export function PredictionForm({ race, racersById, existingPrediction, onSave, onError }: Props) {
  const { user } = useUser();
  const [orderedRacerIds, setOrderedRacerIds] = useState<string[]>(
    existingPrediction?.racerIds ?? race.racerIds
  );
  const [saving, setSaving] = useState(false);

  function move(index: number, direction: -1 | 1) {
    const next = [...orderedRacerIds];
    const swapIndex = index + direction;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    setOrderedRacerIds(next);
  }

  async function handleSave() {
    if (!user) return;
    const prediction: Prediction = {
      seasonId: race.seasonId,
      raceId: race.id,
      userId: user.id,
      racerIds: orderedRacerIds,
    };
    setSaving(true);
    try {
      const res = await fetch("/api/predict/prediction", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prediction),
      });
      if (!res.ok) { onError("Failed to save prediction."); return; }
      onSave(prediction);
    } catch {
      onError("Failed to save prediction.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-3">
      <ul className="space-y-2">
        {orderedRacerIds.map((racerId, index) => {
          const racer = racersById[racerId];
          if (!racer) return null;
          return (
            <li key={racerId} className="flex items-center gap-3">
              <span className="w-6 text-sm text-muted-foreground text-right">{index + 1}</span>
              <RacerAvatar name={racer.name} image={racer.image} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{racer.name}</p>
                <p className="text-xs text-muted-foreground truncate">{racer.team}</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || saving}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => move(index, 1)}
                  disabled={index === orderedRacerIds.length - 1 || saving}
                >
                  ↓
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <Button onClick={handleSave} disabled={saving}>
        {saving && <Spinner className="w-3 h-3 mr-1" />}
        Save prediction
      </Button>
    </section>
  );
}
