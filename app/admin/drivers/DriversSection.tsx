"use client";

import { useState } from "react";
import { type Racer } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RacerAvatar } from "@/components/RacerAvatar";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Draft = { name: string; team: string; image?: string; teamColor?: string };

type Props = {
  racers: Racer[];
  onRacersChange: (racers: Racer[]) => void;
  onError: (msg: string) => void;
};

export function DriversSection({ racers, onRacersChange, onError }: Props) {
  const [newRacer, setNewRacer] = useState<Draft>({ name: "", team: "", image: "", teamColor: "" });
  const [editingRacerId, setEditingRacerId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>({ name: "", team: "", image: "", teamColor: "" });
  const [loadingOp, setLoadingOp] = useState<string | null>(null);

  const busy = loadingOp !== null;

  async function handleAdd() {
    const name = newRacer.name.trim();
    const team = newRacer.team.trim();
    if (!name || !team) return;
    const racer: Racer = { id: crypto.randomUUID(), name, team, image: newRacer.image || undefined, teamColor: newRacer.teamColor || undefined };
    setLoadingOp("add");
    try {
      const res = await fetch("/api/racers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(racer),
      });
      if (!res.ok) { onError("Failed to save drivers."); return; }
      onRacersChange([...racers, racer]);
      setNewRacer({ name: "", team: "", image: "", teamColor: "" });
    } catch {
      onError("Failed to save drivers.");
    } finally {
      setLoadingOp(null);
    }
  }

  function startEdit(racer: Racer) {
    setEditingRacerId(racer.id);
    setEditDraft({ name: racer.name, team: racer.team, image: racer.image, teamColor: racer.teamColor });
  }

  async function commitEdit(id: string) {
    const data = { name: editDraft.name, team: editDraft.team, image: editDraft.image || undefined, teamColor: editDraft.teamColor || undefined };
    setLoadingOp(`save-${id}`);
    try {
      const res = await fetch(`/api/racers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { onError("Failed to save drivers."); return; }
      onRacersChange(racers.map((r) => (r.id === id ? { ...r, ...data } : r)));
      setEditingRacerId(null);
    } catch {
      onError("Failed to save drivers.");
    } finally {
      setLoadingOp(null);
    }
  }

  async function handleRemove(id: string) {
    setLoadingOp(`remove-${id}`);
    try {
      const res = await fetch(`/api/racers/${id}`, { method: "DELETE" });
      if (!res.ok) { onError("Failed to save drivers."); return; }
      onRacersChange(racers.filter((r) => r.id !== id));
    } catch {
      onError("Failed to save drivers.");
    } finally {
      setLoadingOp(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Drivers</h2>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-1">
          {racers.map((racer) =>
            editingRacerId === racer.id ? (
              <li key={racer.id} className="space-y-2 bg-muted/50 rounded-sm p-3">
                <Input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} placeholder="Name" />
                <Input value={editDraft.team} onChange={(e) => setEditDraft({ ...editDraft, team: e.target.value })} placeholder="Team" />
                <Input value={editDraft.image ?? ""} onChange={(e) => setEditDraft({ ...editDraft, image: e.target.value })} placeholder="Image URL (optional)" />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editDraft.teamColor || "#6b7280"}
                    onChange={(e) => setEditDraft({ ...editDraft, teamColor: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer border border-border bg-transparent p-0.5"
                    title="Constructor color"
                  />
                  <span className="text-xs text-muted-foreground">Constructor color</span>
                </div>
                <div className="flex gap-2 items-center">
                  <Button size="sm" onClick={() => commitEdit(racer.id)} disabled={busy}>
                    {loadingOp === `save-${racer.id}` && <Spinner className="w-3 h-3 mr-1" />}
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingRacerId(null)} disabled={busy}>Cancel</Button>
                </div>
              </li>
            ) : (
              <li key={racer.id} className="flex items-center gap-3 py-1.5">
                <div
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ backgroundColor: racer.teamColor ?? "#6b7280" }}
                />
                <RacerAvatar name={racer.name} image={racer.image} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{racer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{racer.team}</p>
                </div>
                <div className="flex gap-1 items-center shrink-0">
                  {loadingOp === `remove-${racer.id}` && <Spinner className="w-3 h-3" />}
                  <Button variant="ghost" size="sm" onClick={() => startEdit(racer)} disabled={busy}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleRemove(racer.id)} disabled={busy}>Remove</Button>
                </div>
              </li>
            )
          )}
        </ul>
        {racers.length > 0 && <Separator />}
        <div className="space-y-2">
          <Input value={newRacer.name} onChange={(e) => setNewRacer({ ...newRacer, name: e.target.value })} placeholder="Name" />
          <Input value={newRacer.team} onChange={(e) => setNewRacer({ ...newRacer, team: e.target.value })} placeholder="Constructor team" />
          <Input value={newRacer.image ?? ""} onChange={(e) => setNewRacer({ ...newRacer, image: e.target.value })} placeholder="Image URL (optional)" />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={newRacer.teamColor || "#6b7280"}
              onChange={(e) => setNewRacer({ ...newRacer, teamColor: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer border border-border bg-transparent p-0.5"
              title="Constructor color"
            />
            <span className="text-xs text-muted-foreground">Constructor color</span>
          </div>
          <Button variant="outline" onClick={handleAdd} disabled={busy}>
            {loadingOp === "add" && <Spinner className="w-3 h-3 mr-1" />}
            Add driver
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
