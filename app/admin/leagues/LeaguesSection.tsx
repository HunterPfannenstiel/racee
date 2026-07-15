"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { HelpCircle } from "lucide-react";
import { type League, type PropPointValues, type PlacementPoints } from "@/lib/schemas";
import { orpc } from "@/lib/orpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PropPointValuesEditor } from "./PropPointValuesEditor";
import { PlacementPointsEditor } from "./PlacementPointsEditor";

type Props = {
  leagues: League[];
  motorsportId: string | null;
  onLeaguesChange: (leagues: League[]) => void;
  onError: (msg: string) => void;
};

const emptyPropPointValues: PropPointValues = {
  driverOfDay: 0, lapsLed: 0, fastestPitStop: 0,
  fastestLap: 0, overAchiever: 0, underAchiever: 0, wrecker: 0,
};
const emptyPlacementPoints: PlacementPoints = [];

export function LeaguesSection({ leagues, motorsportId, onLeaguesChange, onError }: Props) {
  const [newLeagueName, setNewLeagueName] = useState("");
  const [newPlacementPoints, setNewPlacementPoints] = useState<PlacementPoints>(emptyPlacementPoints);
  const [newMulliganCount, setNewMulliganCount] = useState(0);
  const [newStageCount, setNewStageCount] = useState(0);
  const [newScoringDepth, setNewScoringDepth] = useState<number | undefined>(undefined);
  const [newPropPointValues, setNewPropPointValues] = useState<PropPointValues>(emptyPropPointValues);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingLeagueId, setEditingLeagueId] = useState<string | null>(null);
  const [editLeagueName, setEditLeagueName] = useState("");
  const [editPlacementPoints, setEditPlacementPoints] = useState<PlacementPoints>(emptyPlacementPoints);
  const [editMulliganCount, setEditMulliganCount] = useState(0);
  const [editStageCount, setEditStageCount] = useState(0);
  const [editScoringDepth, setEditScoringDepth] = useState<number | undefined>(undefined);
  const [editPropPointValues, setEditPropPointValues] = useState<PropPointValues>(emptyPropPointValues);
  const [loadingOp, setLoadingOp] = useState<string | null>(null);

  const createMutation = useMutation(orpc.leagues.create.mutationOptions());
  const updateMutation = useMutation(orpc.leagues.update.mutationOptions());
  const deleteMutation = useMutation(orpc.leagues.delete.mutationOptions());

  const busy = loadingOp !== null;

  async function handleAdd() {
    const name = newLeagueName.trim();
    if (!name || !motorsportId) return;
    setLoadingOp("add");
    try {
      const league = await createMutation.mutateAsync({
        name,
        motorsportId,
        placementPoints: newPlacementPoints,
        mulliganCount: newMulliganCount,
        stageCount: newStageCount,
        scoringDepth: newScoringDepth,
        propPointValues: newPropPointValues,
      });
      onLeaguesChange([...leagues, league]);
      setNewLeagueName("");
      setNewPlacementPoints(emptyPlacementPoints);
      setNewMulliganCount(0);
      setNewStageCount(0);
      setNewScoringDepth(undefined);
      setNewPropPointValues(emptyPropPointValues);
      setIsAddingNew(false);
    } catch {
      onError("Failed to save league.");
    } finally {
      setLoadingOp(null);
    }
  }

  function selectLeague(league: League) {
    setIsAddingNew(false);
    setNewLeagueName("");
    setEditingLeagueId(league.id);
    setEditLeagueName(league.name);
    setEditPlacementPoints(league.placementPoints);
    setEditMulliganCount(league.mulliganCount);
    setEditStageCount(league.stageCount ?? 0);
    setEditScoringDepth(league.scoringDepth);
    setEditPropPointValues(league.propPointValues);
  }

  async function handleUpdate() {
    const name = editLeagueName.trim();
    if (!name || !editingLeagueId) return;
    const patch = { name, placementPoints: editPlacementPoints, mulliganCount: editMulliganCount, stageCount: editStageCount, scoringDepth: editScoringDepth, propPointValues: editPropPointValues };
    setLoadingOp("save");
    try {
      const updated = await updateMutation.mutateAsync({ leagueId: editingLeagueId, patch });
      onLeaguesChange(leagues.map((s) => s.id === editingLeagueId ? updated : s));
      setEditingLeagueId(null);
    } catch {
      onError("Failed to save league.");
    } finally {
      setLoadingOp(null);
    }
  }

  async function handleRemove() {
    if (!editingLeagueId) return;
    setLoadingOp("delete");
    try {
      await deleteMutation.mutateAsync({ leagueId: editingLeagueId });
      onLeaguesChange(leagues.filter((s) => s.id !== editingLeagueId));
      setEditingLeagueId(null);
    } catch {
      onError("Failed to delete league.");
    } finally {
      setLoadingOp(null);
    }
  }

  function cancelAdd() {
    setIsAddingNew(false);
    setNewLeagueName("");
    setNewPlacementPoints(emptyPlacementPoints);
    setNewMulliganCount(0);
    setNewScoringDepth(undefined);
    setNewPropPointValues(emptyPropPointValues);
  }

  const addDisabled = busy || !newLeagueName.trim() || !motorsportId;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Leagues</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {leagues.map((s) => (
                <button
                  key={s.id}
                  className={`rounded-sm border p-3 text-sm font-medium text-left transition-colors ${
                    editingLeagueId === s.id
                      ? "border-primary text-primary"
                      : "hover:border-foreground"
                  }`}
                  onClick={() => selectLeague(s)}
                  disabled={busy}
                >
                  {s.name}
                </button>
              ))}
              {!isAddingNew && (
                <button
                  className="rounded-sm border border-dashed p-3 text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                  onClick={() => { setIsAddingNew(true); setEditingLeagueId(null); }}
                  disabled={busy}
                >
                  +
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {isAddingNew && (
          <Card>
            <CardHeader>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">New League</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={newLeagueName}
                onChange={(e) => setNewLeagueName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="League name"
                autoFocus
                disabled={busy}
              />
              <PlacementPointsEditor value={newPlacementPoints} onChange={setNewPlacementPoints} disabled={busy} />
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1">Mulligans</span>
                <NumberInput value={newMulliganCount} onChange={setNewMulliganCount} disabled={busy} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1">Stages</span>
                <NumberInput value={newStageCount} onChange={setNewStageCount} disabled={busy} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1 flex items-center gap-1">
                  Scoring depth
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                        <HelpCircle className="size-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Leave blank to score all finishing positions</TooltipContent>
                  </Tooltip>
                </span>
                <NumberInput value={newScoringDepth} onChange={setNewScoringDepth} min={1} nullable disabled={busy} />
              </div>
              <PropPointValuesEditor values={newPropPointValues} onChange={setNewPropPointValues} disabled={busy} />
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={addDisabled ? 0 : undefined}>
                      <Button variant="outline" onClick={handleAdd} disabled={addDisabled}>
                        {loadingOp === "add" && <Spinner className="w-3 h-3 mr-1" />}
                        Add
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!newLeagueName.trim() && (
                    <TooltipContent>League name is required</TooltipContent>
                  )}
                </Tooltip>
                <Button variant="ghost" onClick={cancelAdd} disabled={busy}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {editingLeagueId !== null && (
          <Card>
            <CardHeader>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Edit League</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={editLeagueName}
                onChange={(e) => setEditLeagueName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                autoFocus
                disabled={busy}
              />
              <PlacementPointsEditor value={editPlacementPoints} onChange={setEditPlacementPoints} disabled={busy} />
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1">Mulligans</span>
                <NumberInput value={editMulliganCount} onChange={setEditMulliganCount} disabled={busy} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1">Stages</span>
                <NumberInput value={editStageCount} onChange={setEditStageCount} disabled={busy} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1 flex items-center gap-1">
                  Scoring depth
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                        <HelpCircle className="size-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Leave blank to score all finishing positions</TooltipContent>
                  </Tooltip>
                </span>
                <NumberInput value={editScoringDepth} onChange={setEditScoringDepth} min={1} nullable disabled={busy} />
              </div>
              <PropPointValuesEditor values={editPropPointValues} onChange={setEditPropPointValues} disabled={busy} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleUpdate} disabled={busy}>
                  {loadingOp === "save" && <Spinner className="w-3 h-3 mr-1" />}
                  Save
                </Button>
                <Button variant="ghost" onClick={() => setEditingLeagueId(null)} disabled={busy}>Cancel</Button>
                <Button variant="destructive" onClick={handleRemove} disabled={busy}>
                  {loadingOp === "delete" && <Spinner className="w-3 h-3 mr-1" />}
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
