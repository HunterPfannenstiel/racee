"use client";

import { useEffect, useState } from "react";
import { type League, type Team, type User } from "@/lib/schemas";
import { useUser } from "@/app/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { LeaguePicker } from "@/components/ui/league-picker";

export default function TeamsPage() {
  const { user } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamColor, setNewTeamColor] = useState("#6b7280");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/teams/init")
      .then((res) => res.json())
      .then(({ users, leagues }: { users: User[]; leagues: League[] }) => {
        setUsers(users);
        setLeagues(leagues);
        if (leagues.length > 0) setSelectedLeagueId(leagues[0].id);
      })
      .catch(() => setError("Failed to load."));
  }, []);

  useEffect(() => {
    if (!selectedLeagueId) return;
    setLoadingTeams(true);
    setTeams([]);
    fetch(`/api/leagues/${selectedLeagueId}/teams`)
      .then((res) => res.json())
      .then((data: Team[]) => setTeams(data))
      .catch(() => setError("Failed to load teams."))
      .finally(() => setLoadingTeams(false));
  }, [selectedLeagueId]);

  async function joinTeam(teamId: string) {
    if (!user || !selectedLeagueId) return;
    setSaving(teamId);
    setError(null);
    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId: selectedLeagueId, userId: user.id, teamId }),
      });
      if (!res.ok) throw new Error();
      setTeams((prev) =>
        prev.map((t) => ({
          ...t,
          memberIds:
            t.id === teamId
              ? [...t.memberIds.filter((id) => id !== user.id), user.id]
              : t.memberIds.filter((id) => id !== user.id),
        }))
      );
    } catch {
      setError("Failed to join team.");
    } finally {
      setSaving(null);
    }
  }

  async function createTeam() {
    const name = newTeamName.trim();
    if (!name || !selectedLeagueId) return;
    setSaving("create");
    setError(null);
    try {
      const newTeam: Team = { id: crypto.randomUUID(), name, memberIds: [], color: newTeamColor };
      const res = await fetch(`/api/leagues/${selectedLeagueId}/teams/${newTeam.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTeam),
      });
      if (!res.ok) throw new Error();
      setTeams((prev) => [...prev, newTeam]);
      setNewTeamName("");
      setNewTeamColor("#6b7280");
    } catch {
      setError("Failed to create team.");
    } finally {
      setSaving(null);
    }
  }

  const myTeam = user
    ? teams.find((t) => t.memberIds.includes(user.id))
    : null;

  return (
    <PageShell title="Teams">
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>✕</Button>
          </AlertDescription>
        </Alert>
      )}

      {leagues.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center">No leagues yet.</p>
      ) : (
        <LeaguePicker leagues={leagues} selectedLeagueId={selectedLeagueId} onSelect={setSelectedLeagueId} />
      )}

      {!user && (
        <p className="text-sm text-muted-foreground text-center">Sign in to join or create a team.</p>
      )}

      {myTeam && (
        <Card>
          <CardHeader>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your Team</h2>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: myTeam.color ?? "#6b7280" }} />
              <p className="font-semibold">{myTeam.name}</p>
            </div>
            <ul className="space-y-0.5">
              {myTeam.memberIds.map((mid) => {
                const u = users.find((u) => u.id === mid);
                if (!u) return null;
                return (
                  <li key={mid} className="text-sm text-muted-foreground">
                    {u.name}{u.id === user?.id ? " (you)" : ""}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">All Teams</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingTeams && <Spinner />}
          {!loadingTeams && teams.length === 0 && (
            <p className="text-sm text-muted-foreground">No teams yet.</p>
          )}
          {teams.map((team, i) => (
            <div key={team.id}>
              {i > 0 && <Separator className="mb-4" />}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-2">
                  <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5" style={{ backgroundColor: team.color ?? "#6b7280" }} />
                  <div className="space-y-0.5">
                  <p className="text-sm font-semibold">{team.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {team.memberIds.length === 0
                      ? "No members"
                      : team.memberIds
                          .map((mid) => users.find((u) => u.id === mid)?.name)
                          .filter(Boolean)
                          .join(", ")}
                  </p>
                  </div>
                </div>
                {user && myTeam?.id !== team.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!saving}
                    onClick={() => joinTeam(team.id)}
                  >
                    {saving === team.id ? <Spinner /> : "Join"}
                  </Button>
                )}
                {user && myTeam?.id === team.id && (
                  <span className="text-xs text-primary font-medium pt-1">Joined</span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {user && selectedLeagueId && (
        <Card>
          <CardHeader>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">New Team</h2>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                type="color"
                value={newTeamColor}
                onChange={(e) => setNewTeamColor(e.target.value)}
                disabled={!!saving}
                className="w-9 h-9 rounded cursor-pointer border border-border bg-transparent p-0.5 shrink-0"
                title="Team color"
              />
              <Input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !saving && createTeam()}
                placeholder="Team name"
                disabled={!!saving}
              />
              <Button variant="outline" disabled={!newTeamName.trim() || !!saving} onClick={createTeam}>
                {saving === "create" ? <Spinner /> : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
