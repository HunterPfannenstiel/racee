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
  const [loadingOp, setLoadingOp] = useState<string | null>(null);

  const busy = loadingOp !== null;

  async function handleRename(team: Team) {
    const name = editName.trim();
    if (!name || name === team.name) { setEditingId(null); return; }
    setLoadingOp(`rename-${team.id}`);
    try {
      const res = await fetch(`/api/leagues/${leagueId}/teams/${team.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...team, name }),
      });
      if (!res.ok) { onError("Failed to rename team."); return; }
      onTeamsChange(teams.map((t) => t.id === team.id ? { ...t, name } : t));
      setEditingId(null);
    } catch {
      onError("Failed to rename team.");
    } finally {
      setLoadingOp(null);
    }
  }

  async function handleColorChange(team: Team, color: string) {
    setLoadingOp(`color-${team.id}`);
    try {
      const res = await fetch(`/api/leagues/${leagueId}/teams/${team.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...team, color }),
      });
      if (!res.ok) { onError("Failed to save team color."); return; }
      onTeamsChange(teams.map((t) => t.id === team.id ? { ...t, color } : t));
    } catch {
      onError("Failed to save team color.");
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
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRename(team)}
                    autoFocus
                    className="h-7 text-sm"
                  />
                  <Button size="sm" onClick={() => handleRename(team)} disabled={busy}>
                    {loadingOp === `rename-${team.id}` && <Spinner className="w-3 h-3 mr-1" />}
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} disabled={busy}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={team.color ?? "#6b7280"}
                      onChange={(e) => handleColorChange(team, e.target.value)}
                      disabled={busy}
                      className="w-5 h-5 rounded-full cursor-pointer border-0 bg-transparent p-0 disabled:opacity-50"
                      title="Team color"
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
                    {(loadingOp === `delete-${team.id}` || loadingOp === `color-${team.id}`) && <Spinner className="w-3 h-3" />}
                    <Button variant="ghost" size="sm" onClick={() => { setEditingId(team.id); setEditName(team.name); }} disabled={busy}>Rename</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(team.id)} disabled={busy}>Delete</Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
