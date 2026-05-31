"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type League, type Team, type User } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LeaguePicker } from "@/components/ui/league-picker";
import { TeamsSection } from "./TeamsSection";

export default function AdminTeamsPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [usersById, setUsersById] = useState<Record<string, User>>({});
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/leagues").then((r) => r.json() as Promise<League[]>),
      fetch("/api/users").then((r) => r.json() as Promise<User[]>),
    ])
      .then(([leagueList, users]) => {
        setLeagues(leagueList);
        setUsersById(Object.fromEntries(users.map((u) => [u.id, u])));
        if (leagueList.length > 0) setSelectedLeagueId(leagueList[0].id);
      })
      .finally(() => setLoadingLeagues(false));
  }, []);

  useEffect(() => {
    if (!selectedLeagueId) return;
    setLoadingTeams(true);
    setTeams([]);
    fetch(`/api/leagues/${selectedLeagueId}/teams`)
      .then((r) => r.json() as Promise<Team[]>)
      .then(setTeams)
      .catch(() => setError("Failed to load teams."))
      .finally(() => setLoadingTeams(false));
  }, [selectedLeagueId]);

  function handleLeagueSelect(id: string) {
    if (id === selectedLeagueId) return;
    setSelectedLeagueId(id);
    setTeams([]);
  }

  return (
    <PageShell title="Teams">
      <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Admin
      </Link>
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>✕</Button>
          </AlertDescription>
        </Alert>
      )}

      {loadingLeagues ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="w-4 h-4" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : leagues.length === 0 ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          No leagues yet.{" "}
          <Link href="/admin/leagues" className="text-primary hover:underline">Create one first.</Link>
        </p>
      ) : (
        <div className="space-y-6">
          <LeaguePicker leagues={leagues} selectedLeagueId={selectedLeagueId} onSelect={handleLeagueSelect} />
          {loadingTeams ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Spinner className="w-4 h-4" />
              <span className="text-xs tracking-widest uppercase">Loading</span>
            </div>
          ) : selectedLeagueId && (
            <TeamsSection
              leagueId={selectedLeagueId}
              teams={teams}
              usersById={usersById}
              onTeamsChange={setTeams}
              onError={setError}
            />
          )}
        </div>
      )}
    </PageShell>
  );
}
