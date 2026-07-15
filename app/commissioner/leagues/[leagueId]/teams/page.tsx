"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { orpc } from "@/lib/orpc/client";

const UNASSIGNED = "__unassigned__";

export default function CommissionerTeamsPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const queryClient = useQueryClient();
  const input = { leagueId };

  // Teams section
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#6b7280");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6b7280");
  const [error, setError] = useState<string | null>(null);

  const rosterQuery = useQuery(orpc.leagues.teams.roster.queryOptions({ input }));
  const leagueQuery = useQuery(orpc.leagues.get.queryOptions({ input }));

  const invalidateTeams = () => {
    queryClient.invalidateQueries({ queryKey: orpc.leagues.teams.roster.key({ input }) });
    queryClient.invalidateQueries({ queryKey: orpc.leagues.teams.list.key({ input }) });
  };
  const createMutation = useMutation(
    orpc.leagues.teams.create.mutationOptions({
      onSuccess: () => {
        invalidateTeams();
        setNewName("");
        setNewColor("#6b7280");
      },
      onError: () => setError("Failed to create team."),
    }),
  );
  const updateMutation = useMutation(
    orpc.leagues.teams.update.mutationOptions({
      onSuccess: () => {
        invalidateTeams();
        setEditingId(null);
      },
      onError: () => setError("Failed to save team."),
    }),
  );
  const deleteMutation = useMutation(
    orpc.leagues.teams.delete.mutationOptions({
      onSuccess: () => {
        invalidateTeams();
        setConfirmDeleteId(null);
      },
      onError: () => setError("Failed to delete team."),
    }),
  );
  const assignMutation = useMutation(
    orpc.leagues.assignments.set.mutationOptions({
      onSuccess: invalidateTeams,
      onError: () => setError("Failed to assign player."),
    }),
  );

  const teams = useMemo(() => rosterQuery.data?.teams ?? [], [rosterQuery.data]);
  const users = rosterQuery.data?.users ?? [];
  const leagueName = leagueQuery.data?.name ?? null;
  const loading = rosterQuery.isPending;

  const busyOp = createMutation.isPending
    ? "create"
    : updateMutation.isPending && updateMutation.variables
      ? `save-${updateMutation.variables.teamId}`
      : deleteMutation.isPending && deleteMutation.variables
        ? `delete-${deleteMutation.variables.teamId}`
        : null;
  const busy = busyOp !== null;
  const savingUserId =
    assignMutation.isPending && assignMutation.variables ? assignMutation.variables.userId : null;

  const teamByUserId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of teams) {
      for (const uid of t.memberIds) map[uid] = t.id;
    }
    return map;
  }, [teams]);

  function handleCreate() {
    const name = newName.trim();
    if (!name || busy) return;
    createMutation.mutate({ leagueId, id: crypto.randomUUID(), name, color: newColor });
  }

  function handleSave(team: { id: string; name: string; color?: string }) {
    const name = editName.trim();
    if (!name) { setEditingId(null); return; }
    const patch: { name?: string; color?: string } = {};
    if (name !== team.name) patch.name = name;
    if (editColor !== (team.color ?? "#6b7280")) patch.color = editColor;
    if (Object.keys(patch).length === 0) { setEditingId(null); return; }
    updateMutation.mutate({ leagueId, teamId: team.id, patch });
  }

  function handleDelete(teamId: string) {
    deleteMutation.mutate({ leagueId, teamId });
  }

  function handleAssign(userId: string, teamId: string | null) {
    if (savingUserId !== null) return;
    assignMutation.mutate({ leagueId, userId, teamId });
  }

  // While an assignment is in flight, show the value being written so the
  // Select doesn't visibly snap back until the roster refetch lands.
  function assignedValue(userId: string): string {
    if (savingUserId === userId && assignMutation.variables) {
      return assignMutation.variables.teamId ?? UNASSIGNED;
    }
    return teamByUserId[userId] ?? UNASSIGNED;
  }

  return (
    <PageShell title="Teams">
      <Link
        href={`/commissioner/leagues/${leagueId}`}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft className="size-3.5" />
        {leagueName ?? "League"}
      </Link>

      {(error ?? rosterQuery.isError) && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error ?? "Failed to load."}
            {error && (
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>✕</Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center pt-8"><Spinner /></div>
      ) : rosterQuery.isError ? null : (
        <>
          <Card>
            <CardHeader>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Teams</h2>
            </CardHeader>
            <CardContent className="space-y-1">
              {teams.length === 0 ? (
                <p className="text-sm text-muted-foreground">No teams yet.</p>
              ) : (
                teams.map((team) => (
                  <div key={team.id} className="py-2">
                    {editingId === team.id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="w-7 h-7 rounded cursor-pointer border border-border bg-transparent p-0.5 shrink-0"
                          title="Team color"
                        />
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSave(team)}
                          autoFocus
                          className="h-8 text-sm"
                        />
                        <Button size="sm" onClick={() => handleSave(team)} disabled={busy}>
                          {busyOp === `save-${team.id}` && <Spinner className="w-3 h-3 mr-1" />}
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} disabled={busy}>
                          Cancel
                        </Button>
                      </div>
                    ) : confirmDeleteId === team.id ? (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-muted-foreground">
                          Delete &ldquo;{team.name}&rdquo;?
                          {team.memberIds.length > 0 && " Members will become unassigned."}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)} disabled={busy}>
                          Cancel
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(team.id)} disabled={busy}>
                          {busyOp === `delete-${team.id}` && <Spinner className="w-3 h-3 mr-1" />}
                          Delete
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-1 self-stretch rounded-full shrink-0"
                            style={{ backgroundColor: team.color ?? "#6b7280" }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{team.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {team.memberIds.length === 0
                                ? "No members"
                                : team.memberIds
                                    .map((id) => users.find((u) => u.id === id)?.name ?? id)
                                    .join(", ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(team.id);
                              setEditName(team.name);
                              setEditColor(team.color ?? "#6b7280");
                            }}
                            disabled={busy}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              team.memberIds.length === 0
                                ? handleDelete(team.id)
                                : setConfirmDeleteId(team.id)
                            }
                            disabled={busy}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              <div className="flex gap-2 pt-3 border-t border-border/50 mt-2">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0.5 shrink-0"
                  title="Team color"
                />
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Team name"
                  disabled={busy}
                  className="h-8 text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCreate}
                  disabled={busy || !newName.trim()}
                >
                  {busyOp === "create" && <Spinner className="w-3 h-3 mr-1" />}
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Player Assignments
              </h2>
            </CardHeader>
            <CardContent className="space-y-2">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No players yet.</p>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between gap-4 py-1">
                    <span className="text-sm">{user.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {savingUserId === user.id && <Spinner className="w-3 h-3" />}
                      <Select
                        value={assignedValue(user.id)}
                        onValueChange={(val) => handleAssign(user.id, val === UNASSIGNED ? null : val)}
                        disabled={savingUserId !== null}
                      >
                        <SelectTrigger size="sm" className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                          {teams.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageShell>
  );
}
