"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { QueryError, QueryLoading } from "@/components/ui/query-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { orpc } from "@/lib/orpc/client";
import { medalForRank } from "@/lib/medals";
import { formatPoints } from "@/lib/utils";
import { TrophyIcon } from "@/components/trophies/AwardIcons";
import { LeaguePlayerAvatar } from "@/components/avatar/LeaguePlayerAvatar";

function nextLabel(label: string): string {
  const year = /^(\d{4})$/.exec(label.trim());
  return year ? String(Number(year[1]) + 1) : "";
}

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

export default function CommissionerSeasonPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const queryClient = useQueryClient();
  const historyQuery = useQuery(orpc.history.get.queryOptions({ input: { leagueId } }));
  const teamsQuery = useQuery(orpc.leagues.teams.list.queryOptions({ input: { leagueId } }));
  const [error, setError] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: orpc.history.key() });
    queryClient.invalidateQueries({ queryKey: orpc.leagues.key() });
    queryClient.invalidateQueries({ queryKey: orpc.standings.key() });
    queryClient.invalidateQueries({ queryKey: orpc.races.key() });
  };
  const endMutation = useMutation(
    orpc.history.endSeason.mutationOptions({ onSuccess: invalidate, onError: (e) => setError(errorMessage(e, "Couldn't end the season.")) }),
  );
  const reopenMutation = useMutation(
    orpc.history.reopenSeason.mutationOptions({ onSuccess: invalidate, onError: (e) => setError(errorMessage(e, "Couldn't reopen the season.")) }),
  );

  const data = historyQuery.data;
  const current = data?.seasons[data.seasons.length - 1];
  const leader = current?.players.filter((p) => p.rank !== null && p.rank <= 3) ?? [];

  return (
    <PageShell title="Season">
      <Link
        href={`/commissioner/leagues/${leagueId}`}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft className="size-3.5" />
        {data?.leagueName ?? "League"}
      </Link>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>✕</Button>
          </AlertDescription>
        </Alert>
      )}

      {historyQuery.isPending ? (
        <QueryLoading />
      ) : historyQuery.isError ? (
        <QueryError error={historyQuery.error} onRetry={() => historyQuery.refetch()} />
      ) : data && !data.canManage ? (
        <p className="text-sm text-muted-foreground">Only commissioners can manage the season.</p>
      ) : data && current ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {data.current.label} season · {data.current.ended ? "Final" : "In progress"}
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                {data.current.scoredRaces} of {data.current.totalRaces} races scored.
              </p>
              {leader.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{data.current.ended ? "Trophy winners" : "Top 3 right now"}</p>
                  {leader.map((p) => {
                    const trophy = medalForRank(p.rank!, p.total);
                    return (
                      <div key={(p.userId ?? p.name) + p.rank} className="flex items-center gap-2 text-sm">
                        {trophy && <TrophyIcon medal={trophy} className="size-5" />}
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-muted-foreground tabular-nums">{formatPoints(p.total)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {!data.current.ended ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Ending the season locks in the final standings and hands out trophies to the top 3 players (and teams).
                    Races after the last scored race won&apos;t count. You can still fix scores afterward and the trophies
                    will follow, and you can reopen the season until you start the next one.
                  </p>
                  <Button onClick={() => setConfirmEnd(true)} disabled={endMutation.isPending || data.current.scoredRaces === 0}>
                    {endMutation.isPending && <Spinner className="w-3 h-3 mr-1" />}
                    End season
                  </Button>
                </>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => reopenMutation.mutate({ leagueId })} disabled={reopenMutation.isPending}>
                    {reopenMutation.isPending && <Spinner className="w-3 h-3 mr-1" />}
                    Reopen season
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {data.current.ended && (
            <StartNextSeasonCard
              leagueId={leagueId}
              currentLabel={data.current.label}
              members={data.members}
              teamCount={teamsQuery.data?.length ?? 0}
              takenLabels={data.seasons.map((s) => s.label.toLowerCase())}
              onDone={invalidate}
              onError={setError}
            />
          )}
        </div>
      ) : null}

      <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End the {data?.current.label} season?</AlertDialogTitle>
            <AlertDialogDescription>
              Final standings lock in and trophies go to the top 3. Everyone in the league gets a notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => endMutation.mutate({ leagueId })}>End season</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function StartNextSeasonCard({
  leagueId,
  currentLabel,
  members,
  teamCount,
  takenLabels,
  onDone,
  onError,
}: {
  leagueId: string;
  currentLabel: string;
  members: { id: string; name: string }[];
  teamCount: number;
  takenLabels: string[];
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const [label, setLabel] = useState(() => nextLabel(currentLabel));
  const [keep, setKeep] = useState<Set<string>>(() => new Set(members.map((m) => m.id)));
  const [teams, setTeams] = useState<"keep" | "reset">("keep");
  const [settings, setSettings] = useState<"keep" | "change">("keep");
  const [confirm, setConfirm] = useState(false);
  const [started, setStarted] = useState(false);

  const startMutation = useMutation(
    orpc.history.startNextSeason.mutationOptions({
      onSuccess: () => {
        setStarted(true);
        onDone();
      },
      onError: (e) => onError(errorMessage(e, "Couldn't start the next season.")),
    }),
  );

  const trimmed = label.trim();
  const labelTaken = takenLabels.includes(trimmed.toLowerCase());
  const toggle = (id: string) =>
    setKeep((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (started) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6">
          <p className="text-sm font-semibold">The {trimmed} season has started.</p>
          <p className="text-xs text-muted-foreground">
            Last season is saved in League History on the standings page. Players you didn&apos;t carry over can rejoin with
            the invite link.
          </p>
          {settings === "change" && (
            <Button asChild>
              <Link href={`/commissioner/leagues/${leagueId}/settings`}>Change league settings</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Start next season</h2>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground" htmlFor="season-label">
            Season name
          </label>
          <Input id="season-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. 2027" maxLength={40} />
          {labelTaken && <p className="text-xs text-destructive">That name is already used by another season.</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Players ({keep.size} of {members.length})
            </p>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setKeep(new Set(members.map((m) => m.id)))}>
                Reinvite all
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setKeep(new Set())}>
                None
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Checked players carry over. Anyone left off can rejoin later with the invite link. You always stay.
          </p>
          <div className="divide-y divide-border rounded-sm border border-border">
            {members.map((m) => (
              <label key={m.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer">
                <input type="checkbox" checked={keep.has(m.id)} onChange={() => toggle(m.id)} />
                <LeaguePlayerAvatar userId={m.id} name={m.name} leagueId={leagueId} size="sm" action="none" />
                <span className="truncate">{m.name}</span>
              </label>
            ))}
          </div>
        </div>

        {teamCount > 0 && (
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Teams</legend>
            <label className="flex items-start gap-2 text-sm">
              <input type="radio" name="teams" className="mt-1" checked={teams === "keep"} onChange={() => setTeams("keep")} />
              <span>
                Keep all teams (franchise)
                <span className="block text-xs text-muted-foreground">
                  Same teams, names and logos. Their stats keep building in the history books even as players change.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="radio" name="teams" className="mt-1" checked={teams === "reset"} onChange={() => setTeams("reset")} />
              <span>
                Reset teams
                <span className="block text-xs text-muted-foreground">Delete every team and build new ones. Old teams stay in history.</span>
              </span>
            </label>
          </fieldset>
        )}

        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Settings</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="settings" checked={settings === "keep"} onChange={() => setSettings("keep")} />
            Keep the same settings
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="settings" checked={settings === "change"} onChange={() => setSettings("change")} />
            I want to change settings (opens Settings after starting)
          </label>
        </fieldset>

        <Button onClick={() => setConfirm(true)} disabled={!trimmed || labelTaken || startMutation.isPending}>
          {startMutation.isPending && <Spinner className="w-3 h-3 mr-1" />}
          Start {trimmed || "next"} season
        </Button>
      </CardContent>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start the {trimmed} season?</AlertDialogTitle>
            <AlertDialogDescription>
              The {currentLabel} season gets saved to the history book and the standings start fresh. {keep.size}{" "}
              {keep.size === 1 ? "player carries" : "players carry"} over
              {members.length - keep.size > 0 ? ` and ${members.length - keep.size} will be removed from the league` : ""}.
              {teamCount > 0 && (teams === "keep" ? " Teams are kept." : " All teams are deleted.")} This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => startMutation.mutate({ leagueId, label: trimmed, keepUserIds: [...keep], teams })}
            >
              Start season
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
