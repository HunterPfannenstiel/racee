"use client";

import { useState } from "react";
import { type Race, type Racer, type Prediction } from "@/lib/schemas";
import { useUser } from "@/app/context/UserContext";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { RacerAvatar } from "@/components/RacerAvatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeyRoundIcon } from "lucide-react";

type Props = {
  race: Race;
  racersById: Record<string, Racer>;
  existingPrediction: Prediction | null;
  existingKey: Prediction | null;
  onSave: (prediction: Prediction) => void;
  onError: (msg: string) => void;
};

export function PredictionForm({ race, racersById, existingPrediction, existingKey, onSave, onError }: Props) {
  const { user } = useUser();
  const [orderedRacerIds, setOrderedRacerIds] = useState<string[]>(
    existingPrediction?.racerIds ?? race.racerIds
  );
  const [keyMode, setKeyMode] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggleKeyMode() {
    const next = !keyMode;
    setKeyMode(next);
    setOrderedRacerIds(next ? existingKey?.racerIds ?? [...race.racerIds] : existingPrediction?.racerIds ?? [...race.racerIds]);
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...orderedRacerIds];
    const swapIndex = index + direction;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    setOrderedRacerIds(next);
  }

  async function savePrediction() {
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

  async function saveKey() {
    if (!user) return;
    const prediction: Prediction = {
      seasonId: race.seasonId,
      raceId: race.id,
      userId: user.id,
      racerIds: orderedRacerIds,
    };
    setSaving(true);
    try {
      const res = await fetch("/api/races/key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prediction),
      });
      if (!res.ok) { onError("Failed to save key."); return; }
      onSave(prediction);
      setKeyMode(false);
      setOrderedRacerIds(existingPrediction?.racerIds ?? [...race.racerIds]);
    } catch {
      onError("Failed to save key.");
    } finally {
      setSaving(false);
      setConfirming(false);
    }
  }

  return (
    <section className={`space-y-3 rounded-lg transition-colors ${keyMode ? "ring-2 ring-amber-400/60 bg-amber-50/40 p-3" : ""}`}>
      <button
        onClick={toggleKeyMode}
        disabled={saving}
        className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
          keyMode
            ? "text-amber-600"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <KeyRoundIcon className="size-3" />
        Create Key
        {keyMode && <span className="normal-case font-normal text-amber-500">(active)</span>}
        {!keyMode && existingKey && <span className="normal-case font-normal text-green-600">(saved)</span>}
      </button>

      <ul className="space-y-2 max-h-96 overflow-y-auto">
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

      {keyMode ? (
        <Button
          onClick={() => setConfirming(true)}
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          Save Key
        </Button>
      ) : (
        <Button onClick={savePrediction} disabled={saving}>
          {saving && <Spinner className="w-3 h-3 mr-1" />}
          Save prediction
        </Button>
      )}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save race key?</DialogTitle>
            <DialogDescription>
              This will set the official result for {race.title}. Any existing key will be overwritten.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveKey} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white">
              {saving && <Spinner className="w-3 h-3 mr-1" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
