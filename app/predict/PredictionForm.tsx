"use client";

import { useState } from "react";
import { type Racer, type PropName } from "@/lib/schemas";
import { useUser } from "@/app/context/UserContext";
import { useRaceLock } from "@/components/prediction/hooks/useRaceLock";
import { usePredictionSave } from "@/components/prediction/hooks/usePredictionSave";
import { PredictionEditor } from "@/components/prediction/PredictionEditor";

type PredictRace = {
  id: string;
  leagueId: string;
  title: string;
  label?: string;
  date: string;
  lockTime?: string;
  startingGrid: string[];
};

// Racers here are always the client-facing DTO shape (no motorsportId — the
// motorsport is already implied by the race/league context), a subset of
// the full domain-backed Racer used elsewhere (e.g. admin racer management).
type PredictRacer = Pick<Racer, "id" | "name" | "team" | "image" | "teamColor">;

type Props = {
  race: PredictRace;
  leagueId: string;
  racersById: Record<string, PredictRacer>;
  existingPrediction: string[] | null;
  existingSubmittedAt: string | null;
  existingPropPicks: Partial<Record<PropName, string>>;
  existingSubmittedByName?: string | null;
  keyIsSet: boolean;
  isProxy?: boolean;
  targetUserId?: string;
  targetUserName?: string;
  teamColor?: string;
};

export function PredictionForm({
  race,
  leagueId,
  racersById,
  existingPrediction,
  existingSubmittedAt,
  existingPropPicks,
  existingSubmittedByName,
  keyIsSet,
  isProxy,
  targetUserId,
  targetUserName,
  teamColor,
}: Props) {
  const { user } = useUser();
  const [submittedAt, setSubmittedAt] = useState<string | null>(existingSubmittedAt);
  const [submittedByName, setSubmittedByName] = useState<string | null>(existingSubmittedByName ?? null);

  const { isLocked, countdown } = useRaceLock({ lockTime: race.lockTime, keyIsSet });
  const { saving, saved, save } = usePredictionSave({
    leagueId,
    raceId: race.id,
    targetUserId,
  });

  async function handleSubmit(racerIds: string[], propPicks: Partial<Record<PropName, string>>) {
    if (!user) return;
    const result = await save(racerIds, propPicks);
    if (!result) return;
    setSubmittedAt(result.submittedAt);
    if (isProxy) setSubmittedByName("You");
  }

  return (
    <PredictionEditor
      race={race}
      racersById={racersById}
      initialRacerIds={existingPrediction ?? race.startingGrid}
      initialPropPicks={existingPropPicks}
      isLocked={isLocked}
      lockCountdown={countdown}
      saving={saving}
      saved={saved}
      onSubmit={handleSubmit}
      submittedAt={submittedAt}
      submittedByName={submittedByName}
      submitLabel={isProxy && targetUserName ? `Submit for ${targetUserName}` : "Submit Predictions"}
      accentColor={teamColor}
      variant={isProxy ? "outline" : "default"}
    />
  );
}
