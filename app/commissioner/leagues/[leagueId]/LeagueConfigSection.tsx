"use client";

import { useState } from "react";
import { type League, type PropPointValues, type PlacementPoints } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { PropPointValuesEditor } from "@/app/admin/leagues/PropPointValuesEditor";
import { PlacementPointsEditor } from "@/app/admin/leagues/PlacementPointsEditor";

type Props = {
  leagueId: string;
  league: League;
  onLeagueChange: (league: League) => void;
  onError: (msg: string) => void;
};

export function LeagueConfigSection({ leagueId, league, onLeagueChange, onError }: Props) {
  const [name, setName] = useState(league.name);
  const [placementPoints, setPlacementPoints] = useState<PlacementPoints>(league.placementPoints);
  const [mulliganCount, setMulliganCount] = useState(league.mulliganCount);
  const [stageCount, setStageCount] = useState(league.stageCount ?? 0);
  const [scoringDepth, setScoringDepth] = useState<number | undefined>(league.scoringDepth);
  const [propPointValues, setPropPointValues] = useState<PropPointValues>(league.propPointValues);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const patch = { name: trimmed, placementPoints, mulliganCount, stageCount, scoringDepth, propPointValues };
    setSaving(true);
    try {
      const res = await fetch(`/api/commissioner/leagues/${leagueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) { onError("Failed to save league."); return; }
      onLeagueChange({ ...league, ...patch });
    } catch {
      onError("Failed to save league.");
    } finally {
      setSaving(false);
    }
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
          <Input
            type="number"
            min={0}
            className="w-16 text-right"
            value={mulliganCount}
            onChange={(e) => setMulliganCount(Math.max(0, parseInt(e.target.value) || 0))}
            disabled={saving}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1">Stages</span>
          <Input
            type="number"
            min={0}
            className="w-16 text-right"
            value={stageCount}
            onChange={(e) => setStageCount(Math.max(0, parseInt(e.target.value) || 0))}
            disabled={saving}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1">Scoring depth</span>
          <Input
            type="number"
            min={1}
            className="w-16 text-right"
            value={scoringDepth ?? ""}
            onChange={(e) => setScoringDepth(e.target.value === "" ? undefined : Math.max(1, parseInt(e.target.value)))}
            disabled={saving}
          />
        </div>
        <PropPointValuesEditor values={propPointValues} onChange={setPropPointValues} disabled={saving} />
        <Button variant="outline" onClick={handleSave} disabled={saving || !name.trim()}>
          {saving && <Spinner className="w-3 h-3 mr-1" />}
          Save
        </Button>
      </CardContent>
    </Card>
  );
}
