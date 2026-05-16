"use client";

import { useState } from "react";
import { type Season } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  seasons: Season[];
  onSeasonsChange: (seasons: Season[]) => void;
  onError: (msg: string) => void;
};

export function SeasonsSection({ seasons, onSeasonsChange, onError }: Props) {
  const [newSeasonName, setNewSeasonName] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingSeasonId, setEditingSeasonId] = useState<string | null>(null);
  const [editSeasonName, setEditSeasonName] = useState("");
  const [loadingOp, setLoadingOp] = useState<string | null>(null);

  const busy = loadingOp !== null;

  async function save(newSeasons: Season[], op: string): Promise<boolean> {
    setLoadingOp(op);
    try {
      const res = await fetch("/api/seasons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSeasons),
      });
      if (!res.ok) { onError("Failed to save season."); return false; }
      onSeasonsChange(newSeasons);
      return true;
    } catch {
      onError("Failed to save season.");
      return false;
    } finally {
      setLoadingOp(null);
    }
  }

  async function handleAdd() {
    const name = newSeasonName.trim();
    if (!name) return;
    const newSeasons = [...seasons, { id: crypto.randomUUID(), name }];
    if (await save(newSeasons, "add")) {
      setNewSeasonName("");
      setIsAddingNew(false);
    }
  }

  function selectSeason(season: Season) {
    setIsAddingNew(false);
    setNewSeasonName("");
    setEditingSeasonId(season.id);
    setEditSeasonName(season.name);
  }

  async function handleUpdate() {
    const name = editSeasonName.trim();
    if (!name || !editingSeasonId) return;
    const newSeasons = seasons.map((s) => (s.id === editingSeasonId ? { ...s, name } : s));
    if (await save(newSeasons, "save")) setEditingSeasonId(null);
  }

  async function handleRemove() {
    if (!editingSeasonId) return;
    const newSeasons = seasons.filter((s) => s.id !== editingSeasonId);
    if (await save(newSeasons, "delete")) setEditingSeasonId(null);
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Seasons</h2>
      <div className="grid grid-cols-3 gap-2">
        {seasons.map((s) => (
          <button
            key={s.id}
            className={`rounded-lg border p-3 text-sm font-medium text-left transition-colors ${
              editingSeasonId === s.id ? "border-primary" : "hover:border-foreground"
            }`}
            onClick={() => selectSeason(s)}
            disabled={busy}
          >
            {s.name}
          </button>
        ))}
        {isAddingNew ? (
          <div className="col-span-3 flex gap-2">
            <Input
              value={newSeasonName}
              onChange={(e) => setNewSeasonName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Season name"
              autoFocus
            />
            <Button variant="outline" onClick={handleAdd} disabled={busy}>
              {loadingOp === "add" && <Spinner className="w-3 h-3 mr-1" />}
              Add
            </Button>
            <Button variant="ghost" onClick={() => { setIsAddingNew(false); setNewSeasonName(""); }} disabled={busy}>Cancel</Button>
          </div>
        ) : (
          <button
            className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            onClick={() => { setIsAddingNew(true); setEditingSeasonId(null); }}
            disabled={busy}
          >
            +
          </button>
        )}
      </div>
      {editingSeasonId !== null && (
        <div className="flex gap-2 items-center">
          <Input
            value={editSeasonName}
            onChange={(e) => setEditSeasonName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
            autoFocus
          />
          <Button variant="outline" onClick={handleUpdate} disabled={busy}>
            {loadingOp === "save" && <Spinner className="w-3 h-3 mr-1" />}
            Save
          </Button>
          <Button variant="ghost" onClick={() => setEditingSeasonId(null)} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={handleRemove} disabled={busy}>
            {loadingOp === "delete" && <Spinner className="w-3 h-3 mr-1" />}
            Delete
          </Button>
        </div>
      )}
    </section>
  );
}
