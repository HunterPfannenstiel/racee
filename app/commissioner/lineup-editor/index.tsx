"use client";

import Link from "next/link";
import { ChevronLeft, InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RaceSelector } from "@/components/prediction/RaceSelector";
import { PredictionEditor } from "@/components/prediction/PredictionEditor";
import { PlayerIdentityCard } from "./PlayerIdentityCard";
import { useLineupEditor } from "./hooks/useLineupEditor";

type LineupEditorProps = {
  leagueId: string;
  userId: string;
};

export function LineupEditor({ leagueId, userId }: LineupEditorProps) {
  const {
    player,
    races,
    racersById,
    predictions,
    selectedRaceId,
    setSelectedRaceId,
    saveRacePrediction,
    saving,
    saved,
  } = useLineupEditor(leagueId, userId);

  const selectedRace = races.find((r) => r.id === selectedRaceId) ?? null;
  const selectedPrediction = selectedRace ? predictions[selectedRace.id] : null;

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/commissioner/leagues/${leagueId}/players`}>
          <ChevronLeft data-icon="inline-start" />
          Back to Players
        </Link>
      </Button>

      <PlayerIdentityCard name={player.name} avatarUrl={player.avatarUrl} />

      <Alert>
        <InfoIcon />
        <AlertDescription>
          All races are open for editing in commissioner mode — nothing is locked.
        </AlertDescription>
      </Alert>

      <RaceSelector races={races} selectedRaceId={selectedRaceId} onSelect={setSelectedRaceId} />

      {selectedRace && (
        <PredictionEditor
          key={selectedRace.id}
          race={selectedRace}
          racersById={racersById}
          initialRacerIds={selectedPrediction?.racerIds ?? selectedRace.startingGrid}
          initialPropPicks={selectedPrediction?.propPicks ?? {}}
          isLocked={false}
          lockCountdown={null}
          saving={saving}
          saved={saved}
          onSubmit={(racerIds, propPicks) => saveRacePrediction(selectedRace.id, racerIds, propPicks)}
          submittedAt={selectedPrediction?.submittedAt ?? null}
          submittedByName={selectedPrediction?.submittedByName ?? null}
          submitLabel={`Submit for ${player.name}`}
          accentColor={player.teamColor}
          variant="outline"
        />
      )}
    </div>
  );
}
