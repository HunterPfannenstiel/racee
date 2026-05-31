"use client";

import { useState } from "react";
import { type League, type PropPointValues, type PlacementPoints } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { PropPointValuesEditor } from "./PropPointValuesEditor";
import { PlacementPointsEditor } from "./PlacementPointsEditor";

type Props = {
  leagues: League[];
  onLeaguesChange: (leagues: League[]) => void;
  onError: (msg: string) => void;
};

const emptyPropPointValues: PropPointValues = {
  driverOfDay: 0, lapsLed: 0, fastestPitStop: 0,
  fastestLap: 0, overAchiever: 0, underAchiever: 0, wrecker: 0,
};
const emptyPlacementPoints: PlacementPoints = [];

export function LeaguesSection({ leagues, onLeaguesChange, onError }: Props) {
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
  const [editScoringDepth, setEditScoringDepth] = useState(1);
  const [editPropPointValues, setEditPropPointValues] = useState<PropPointValues>(emptyPropPointValues);
  const [loadingOp, setLoadingOp] = useState<string | null>(null);

  const busy = loadingOp !== null;

  async function handleAdd() {
    const name = newLeagueName.trim();
    if (!name || newScoringDepth === undefined) return;
    const league: League = { id: crypto.randomUUID(), name, placementPoints: newPlacementPoints, mulliganCount: newMulliganCount, stageCount: newStageCount, scoringDepth: newScoringDepth, propPointValues: newPropPointValues };
    setLoadingOp("add");
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(league),
      });
      if (!res.ok) { onError("Failed to save league."); return; }
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
      const res = await fetch(`/api/leagues/${editingLeagueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) { onError("Failed to save league."); return; }
      onLeaguesChange(leagues.map((s) => s.id === editingLeagueId ? { ...s, ...patch } : s));
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
      const res = await fetch(`/api/leagues/${editingLeagueId}`, { method: "DELETE" });
      if (!res.ok) { onError("Failed to delete league."); return; }
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

  return (
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
              <Input
                type="number"
                min={0}
                className="w-16 text-right"
                value={newMulliganCount}
                onChange={(e) => setNewMulliganCount(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={busy}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1">Stages</span>
              <Input
                type="number"
                min={0}
                className="w-16 text-right"
                value={newStageCount}
                onChange={(e) => setNewStageCount(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={busy}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1">Scoring depth</span>
              <Input
                type="number"
                min={1}
                className="w-16 text-right"
                value={newScoringDepth ?? ""}
                onChange={(e) => setNewScoringDepth(e.target.value === "" ? undefined : Math.max(1, parseInt(e.target.value)))}
                disabled={busy}
              />
            </div>
            <PropPointValuesEditor values={newPropPointValues} onChange={setNewPropPointValues} disabled={busy} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleAdd} disabled={busy || !newLeagueName.trim()}>
                {loadingOp === "add" && <Spinner className="w-3 h-3 mr-1" />}
                Add
              </Button>
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
              <Input
                type="number"
                min={0}
                className="w-16 text-right"
                value={editMulliganCount}
                onChange={(e) => setEditMulliganCount(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={busy}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1">Stages</span>
              <Input
                type="number"
                min={0}
                className="w-16 text-right"
                value={editStageCount}
                onChange={(e) => setEditStageCount(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={busy}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1">Scoring depth</span>
              <Input
                type="number"
                min={1}
                className="w-16 text-right"
                value={editScoringDepth}
                onChange={(e) => setEditScoringDepth(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={busy}
              />
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
  );
}
