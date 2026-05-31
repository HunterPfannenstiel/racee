"use client";

import { useState } from "react";
import { type Team, type User } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

type Props = {
  leagueId: string;
  teams: Team[];
  usersById: Record<string, User>;
  onTeamsChange: (teams: Team[]) => void;
  onError: (msg: string) => void;
};

export function TeamsSection({ leagueId, teams, usersById, onTeamsChange, onError }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [loadingOp, setLoadingOp] = useState<string | null>(null);

  const busy = loadingOp !== null;

  async function handleCreate() {
    const name = newTeamName.trim();
    if (!name) return;
    const team = { id: crypto.randomUUID(), name };
    setLoadingOp("create");
    try {
      const res = await fetch(`/api/leagues/${leagueId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(team),
      });
      if (!res.ok) { onError("Failed to create team."); return; }
      onTeamsChange([...teams, { ...team, memberIds: [] }]);
      setNewTeamName("");
    } catch {
      onError("Failed to create team.");
    } finally {
      setLoadingOp(null);
    }
  }

  async function handleSave(team: Team) {
    const name = editName.trim();
    if (!name) { setEditingId(null); return; }
    const patch: { name?: string; color?: string } = {};
    if (name !== team.name) patch.name = name;
    if (editColor !== (team.color ?? "#6b7280")) patch.color = editColor;
    if (Object.keys(patch).length === 0) { setEditingId(null); return; }
    setLoadingOp(`save-${team.id}`);
    try {
      const res = await fetch(`/api/leagues/${leagueId}/teams/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) { onError("Failed to save team."); return; }
      onTeamsChange(teams.map((t) => t.id === team.id ? { ...t, ...patch } : t));
      setEditingId(null);
    } catch {
      onError("Failed to save team.");
    } finally {
      setLoadingOp(null);
    }
  }

  async function handleDelete(teamId: string) {
    setLoadingOp(`delete-${teamId}`);
    try {
      const res = await fetch(`/api/leagues/${leagueId}/teams/${teamId}`, { method: "DELETE" });
      if (!res.ok) { onError("Failed to delete team."); return; }
      onTeamsChange(teams.filter((t) => t.id !== teamId));
    } catch {
      onError("Failed to delete team.");
    } finally {
      setLoadingOp(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Teams</h2>
      </CardHeader>
      <CardContent className="space-y-1">
        {teams.length === 0 ? (
          <p className="text-xs text-muted-foreground">No teams for this league.</p>
        ) : (
          teams.map((team) => (
            <div key={team.id} className="py-2">
              {editingId === team.id ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border border-border bg-transparent p-0.5"
                    title="Team color"
                  />
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSave(team)}
                    autoFocus
                    className="h-7 text-sm"
                  />
                  <Button size="sm" onClick={() => handleSave(team)} disabled={busy}>
                    {loadingOp === `save-${team.id}` && <Spinner className="w-3 h-3 mr-1" />}
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} disabled={busy}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-border/50 opacity-60 shrink-0"
                      style={{ backgroundColor: team.color ?? "#6b7280" }}
                    />
                    <div>
                      <p className="text-sm font-medium">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {team.memberIds.length === 0
                          ? "No members"
                          : team.memberIds.map((id) => usersById[id]?.name ?? id).join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 items-center">
                    {loadingOp === `delete-${team.id}` && <Spinner className="w-3 h-3" />}
                    <Button variant="ghost" size="sm" onClick={() => { setEditingId(team.id); setEditName(team.name); setEditColor(team.color ?? "#6b7280"); }} disabled={busy}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(team.id)} disabled={busy}>Delete</Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div className="flex gap-2 pt-2">
          <Input
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="New team name"
            disabled={busy}
          />
          <Button variant="outline" onClick={handleCreate} disabled={busy || !newTeamName.trim()}>
            {loadingOp === "create" && <Spinner className="w-3 h-3 mr-1" />}
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
