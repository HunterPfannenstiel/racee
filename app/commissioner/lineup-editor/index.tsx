"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RaceSelector } from "@/components/prediction/RaceSelector";
import { PredictionEditor } from "@/components/prediction/PredictionEditor";
import { useUser } from "@/app/context/UserContext";
import { orpc } from "@/lib/orpc/client";
import type { PropName } from "@/lib/schemas";
import { PlayerIdentityCard } from "./PlayerIdentityCard";

type LineupEditorProps = {
  leagueId: string;
  userId: string;
};

type LineupEditorRace = {
  id: string;
  title: string;
  date: string;
  startingGrid: string[];
};

function pickDefaultRaceId(races: LineupEditorRace[]): string | null {
  if (races.length === 0) return null;
  const today = new Date().toISOString().split("T")[0];
  const past = races.filter((r) => r.date <= today).sort((a, b) => b.date.localeCompare(a.date));
  if (past.length > 0) return past[0].id;
  return [...races].sort((a, b) => a.date.localeCompare(b.date))[0].id;
}

export function LineupEditor({ leagueId, userId }: LineupEditorProps) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [pickedRaceId, setPickedRaceId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const playersQuery = useQuery(
    orpc.leagues.players.list.queryOptions({ input: { leagueId } }),
  );
  const predictionsQuery = useQuery(
    orpc.leagues.playerPredictions.get.queryOptions({ input: { leagueId, userId } }),
  );

  const saveMutation = useMutation(
    orpc.leagues.playerPredictions.submit.mutationOptions({
      onSuccess: () => {
        // A commissioner override can re-grade an already-keyed race, so the
        // submission-status and standings read models refetch alongside the lineup.
        queryClient.invalidateQueries({
          queryKey: orpc.leagues.playerPredictions.get.key({ input: { leagueId, userId } }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.leagues.playerStatus.get.key({ input: { leagueId } }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.standings.get.key({ input: { leagueId } }),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    }),
  );

  const nameById = useMemo(() => {
    const all = [
      ...(playersQuery.data?.members ?? []),
      ...(playersQuery.data?.pending ?? []),
    ];
    const map = new Map(all.map((p) => [p.id, p.name]));
    if (user) map.set(user.id, "You");
    return map;
  }, [playersQuery.data, user]);

  const player = { id: userId, name: nameById.get(userId) ?? "" };
  const races: LineupEditorRace[] = predictionsQuery.data?.races ?? [];
  const racersById = predictionsQuery.data?.racersById ?? {};

  const selectedRaceId = pickedRaceId ?? pickDefaultRaceId(races);
  const selectedRace = races.find((r) => r.id === selectedRaceId) ?? null;
  const apiPrediction = selectedRace
    ? predictionsQuery.data?.races.find((r) => r.id === selectedRace.id)?.prediction ?? null
    : null;
  const selectedPrediction = apiPrediction
    ? {
        ...apiPrediction,
        submittedByName: apiPrediction.submittedBy
          ? nameById.get(apiPrediction.submittedBy) ?? null
          : null,
      }
    : null;

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/commissioner/leagues/${leagueId}/players`}>
          <ChevronLeft data-icon="inline-start" />
          Back to Players
        </Link>
      </Button>

      <PlayerIdentityCard name={player.name} />

      <Alert>
        <InfoIcon />
        <AlertDescription>
          All races are open for editing in commissioner mode — nothing is locked.
        </AlertDescription>
      </Alert>

      <RaceSelector races={races} selectedRaceId={selectedRaceId ?? ""} onSelect={setPickedRaceId} />

      {selectedRace && (
        <PredictionEditor
          key={selectedRace.id}
          race={selectedRace}
          racersById={racersById}
          initialRacerIds={selectedPrediction?.racerIds ?? selectedRace.startingGrid}
          initialPropPicks={selectedPrediction?.propPicks ?? {}}
          isLocked={false}
          lockCountdown={null}
          saving={saveMutation.isPending}
          saved={saved}
          onSubmit={(racerIds, propPicks) =>
            saveMutation.mutate({
              leagueId,
              userId,
              raceId: selectedRace.id,
              racerIds,
              // Same zod-inference quirk as usePredictionSave: the schema accepts a
              // partial prop-pick record at runtime but infers it fully required.
              propPicks: propPicks as Record<PropName, string>,
            })
          }
          submittedAt={selectedPrediction?.submittedAt ?? null}
          submittedByName={selectedPrediction?.submittedByName ?? null}
          submitLabel={`Submit for ${player.name}`}
          variant="outline"
        />
      )}
    </div>
  );
}
