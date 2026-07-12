"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type League, type PropPointValues, type PlacementPoints } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { orpc } from "@/lib/orpc/client";
import { PropPointValuesEditor } from "@/app/admin/leagues/PropPointValuesEditor";
import { PlacementPointsEditor } from "@/app/admin/leagues/PlacementPointsEditor";
import { TeamPositionPointsEditor } from "@/app/admin/leagues/TeamPositionPointsEditor";

type Props = {
  leagueId: string;
  league: League;
  onError: (msg: string) => void;
};

export function LeagueConfigSection({ leagueId, league, onError }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(league.name);
  const [placementPoints, setPlacementPoints] = useState<PlacementPoints>(league.placementPoints);
  const [mulliganCount, setMulliganCount] = useState(league.mulliganCount);
  const [stageCount, setStageCount] = useState(league.stageCount ?? 0);
  const [scoringDepth, setScoringDepth] = useState<number | undefined>(league.scoringDepth);
  const [propPointValues, setPropPointValues] = useState<PropPointValues>(league.propPointValues);
  const [teamPositionPoints, setTeamPositionPoints] = useState<number[] | undefined>(league.teamPositionPoints);

  const updateMutation = useMutation(
    orpc.leagues.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.leagues.get.key({ input: { leagueId } }) });
        queryClient.invalidateQueries({ queryKey: orpc.leagues.list.key() });
      },
      onError: () => onError("Failed to save league."),
    }),
  );
  const saving = updateMutation.isPending;

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateMutation.mutate({
      leagueId,
      patch: { name: trimmed, placementPoints, mulliganCount, stageCount, scoringDepth, propPointValues, teamPositionPoints },
    });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">League Settings</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="League name"
          disabled={saving}
        />
        <PlacementPointsEditor value={placementPoints} onChange={setPlacementPoints} disabled={saving} />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1">Mulligans</span>
          <NumberInput value={mulliganCount} onChange={setMulliganCount} disabled={saving} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1">Stages</span>
          <NumberInput value={stageCount} onChange={setStageCount} disabled={saving} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1">Scoring depth</span>
          <NumberInput value={scoringDepth} onChange={setScoringDepth} min={1} nullable disabled={saving} />
        </div>
        <PropPointValuesEditor values={propPointValues} onChange={setPropPointValues} disabled={saving} />
        <TeamPositionPointsEditor value={teamPositionPoints} onChange={setTeamPositionPoints} disabled={saving} />
        <Button variant="outline" onClick={handleSave} disabled={saving || !name.trim()}>
          {saving && <Spinner className="w-3 h-3 mr-1" />}
          Save
        </Button>
      </CardContent>
    </Card>
  );
}
