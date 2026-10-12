"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, InfoIcon, PlusIcon, RotateCcwIcon, Trash2Icon, TriangleAlertIcon, UnlinkIcon, XIcon } from "lucide-react";
import { orpc } from "@/lib/orpc/client";
import type { PlacementPoints, PropPointValues } from "@/lib/schemas";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { QueryError, QueryLoading } from "@/components/ui/query-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { LeaguePlayerAvatar } from "@/components/avatar/LeaguePlayerAvatar";
import { PlayerAvatar } from "@/components/avatar/PlayerAvatar";
import type { NextSeasonSetupResult } from "@/server/queries/next-season-setup/INextSeasonSetupQuery";
import { ConnectedInviteLink } from "@/app/commissioner/invite-link/ConnectedInviteLink";
import { PropPointValuesEditor } from "@/app/admin/leagues/PropPointValuesEditor";
import { PlacementPointsEditor } from "@/app/admin/leagues/PlacementPointsEditor";
import { TeamPositionPointsEditor } from "@/app/admin/leagues/TeamPositionPointsEditor";

const UNASSIGNED = "__unassigned__";
const NO_FRANCHISE = "__none__";

type DraftTeam = {
  /** Local key for this draft row. */
  key: string;
  /** Existing team kept as the same franchise, or null for a new team. */
  teamId: string | null;
  name: string;
  color: string;
  previousTeamIds: string[];
};

type Settings = {
  placementPoints: PlacementPoints;
  mulliganCount: number;
  stageCount: number;
  scoringDepth: number | undefined;
  propPointValues: PropPointValues;
  teamPositionPoints: number[] | undefined;
};

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

const fmt = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/**
 * The next-season draft: who's back, who's new, the team line-up and the rules.
 * Nothing is saved until "Start season" — the season that just ended stays in
 * the history book exactly as it was.
 */
export default function NextSeasonPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  // Loaded once: refetching would wipe the draft (reload the page to pick up players who just joined).
  const setupQuery = useQuery({
    ...orpc.history.nextSeasonSetup.queryOptions({ input: { leagueId } }),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <PageShell title="Next season">
      <Link
        href={`/commissioner/leagues/${leagueId}/season`}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft className="size-3.5" />
        Season
      </Link>
      {setupQuery.isPending ? (
        <QueryLoading />
      ) : setupQuery.isError ? (
        <QueryError error={setupQuery.error} onRetry={() => setupQuery.refetch()} />
      ) : !setupQuery.data.ended ? (
        <p className="text-sm text-muted-foreground">
          End the {setupQuery.data.currentLabel} season first (Commissioner → Season), then set up the next one here.
        </p>
      ) : (
        <Draft leagueId={leagueId} setup={setupQuery.data} />
      )}
    </PageShell>
  );
}

type Setup = NextSeasonSetupResult;

function Draft({ leagueId, setup }: { leagueId: string; setup: Setup }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  // ---- name ----
  const [label, setLabel] = useState(setup.suggestedLabel);
  const trimmed = label.trim();
  const labelTaken = setup.takenLabels.some((l) => l.toLowerCase() === trimmed.toLowerCase());

  // ---- players ----
  const [keep, setKeep] = useState<Set<string>>(() => new Set(setup.members.map((m) => m.id)));
  const [added, setAdded] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const namesById = useMemo(
    () => new Map([...setup.members, ...setup.candidates].map((p) => [p.id, p.name])),
    [setup.members, setup.candidates],
  );
  const roster = [...setup.members.filter((m) => keep.has(m.id)).map((m) => m.id), ...added];
  const toggleKeep = (id: string) =>
    setKeep((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const matches = setup.candidates.filter(
    (c) => !added.includes(c.id) && c.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  // ---- teams ----
  const initialTeams: DraftTeam[] = setup.teams.map((t) => ({
    key: t.teamId,
    teamId: t.teamId,
    name: t.name,
    color: t.color ?? "#6b7280",
    previousTeamIds: t.previousTeamIds,
  }));
  const initialAssign: Record<string, string> = Object.fromEntries(
    setup.teams.flatMap((t) => t.memberIds.map((id) => [id, t.teamId])),
  );
  const [teams, setTeams] = useState<DraftTeam[]>(initialTeams);
  const [assign, setAssign] = useState<Record<string, string>>(initialAssign);
  const [undoReset, setUndoReset] = useState<{ teams: DraftTeam[]; assign: Record<string, string> } | null>(null);
  const [undoDecouple, setUndoDecouple] = useState<DraftTeam[] | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6b7280");
  const pastTeamName = new Map(setup.pastTeams.map((t) => [t.teamId, `${t.name} (${t.lastSeason})`]));

  const updateTeam = (key: string, patch: Partial<DraftTeam>) =>
    setTeams((prev) => prev.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  const deleteTeam = (key: string) => {
    setTeams((prev) => prev.filter((t) => t.key !== key));
    setAssign((prev) => Object.fromEntries(Object.entries(prev).filter(([, k]) => k !== key)));
  };
  const addTeam = () => {
    const name = newName.trim();
    if (!name) return;
    setTeams((prev) => [...prev, { key: crypto.randomUUID(), teamId: null, name, color: newColor, previousTeamIds: [] }]);
    setNewName("");
    setNewColor("#6b7280");
  };
  const resetAll = () => {
    setUndoDecouple(null);
    setUndoReset({ teams, assign });
    setTeams([]);
    setAssign({});
  };
  // Uncoupling a kept team makes it a brand-new franchise (same name, colour and players); the old one stays in the history book.
  const uncouple = (key: string) => updateTeam(key, { teamId: null, previousTeamIds: [] });
  const decoupleAll = () => {
    setUndoDecouple(teams);
    setTeams((prev) => prev.map((t) => ({ ...t, teamId: null, previousTeamIds: [] })));
  };
  const hasFranchise = teams.some((t) => t.teamId || t.previousTeamIds.length > 0);

  // ---- settings ----
  const [changeSettings, setChangeSettings] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    placementPoints: setup.settings.placementPoints,
    mulliganCount: setup.settings.mulliganCount,
    stageCount: setup.settings.stageCount ?? 0,
    scoringDepth: setup.settings.scoringDepth,
    propPointValues: setup.settings.propPointValues,
    teamPositionPoints: setup.settings.teamPositionPoints,
  });

  const duplicateTeamName = new Set(teams.map((t) => t.name.trim().toLowerCase())).size !== teams.length;
  const emptyTeamName = teams.some((t) => !t.name.trim());
  const canStart = !!trimmed && !labelTaken && !duplicateTeamName && !emptyTeamName;

  const startMutation = useMutation(
    orpc.history.startNextSeason.mutationOptions({
      onSuccess: () => {
        setStarted(trimmed);
        // Not the whole history router: this page's own setup query would refetch and swap out the "started" view.
        for (const key of [orpc.history.get.key(), orpc.history.shelf.key(), orpc.leagues.key(), orpc.standings.key(), orpc.races.key(), orpc.me.key()]) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      },
      onError: (e) => setError(errorMessage(e, "Couldn't start the next season.")),
    }),
  );

  function start() {
    const rosterSet = new Set(roster);
    startMutation.mutate({
      leagueId,
      label: trimmed,
      keepUserIds: [...keep],
      addUserIds: added,
      teams: teams.map((t) => ({
        teamId: t.teamId,
        name: t.name.trim(),
        color: t.color,
        memberIds: Object.entries(assign)
          .filter(([userId, key]) => key === t.key && rosterSet.has(userId))
          .map(([userId]) => userId),
        previousTeamIds: t.previousTeamIds,
      })),
      settings: changeSettings ? settings : undefined,
    });
  }

  if (started) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6">
          <p className="text-sm font-semibold">The {started} season has started.</p>
          <p className="text-xs text-muted-foreground">
            Last season is saved in League history on the standings page. You can still change players, teams and settings
            any time from the commissioner pages.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/standings">See the standings</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/commissioner/leagues/${leagueId}`}>Back to the league</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const removed = setup.members.length - keep.size;

  return (
    <div className="space-y-6">
      <div className="flex gap-3 rounded-sm border border-primary/40 bg-primary/5 px-4 py-3 text-sm">
        <InfoIcon className="size-4 shrink-0 text-primary mt-0.5" />
        <p>
          Everything on this page can be changed later. Nothing is saved until you press <strong>Start season</strong>, and
          the {setup.currentLabel} season stays in the history book exactly as it ended, with its teams and trophies.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>✕</Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ---- Season ---- */}
      <Card>
        <CardHeader>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Season</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">Season name</span>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} placeholder="e.g. 2027" />
          </label>
          {labelTaken && <p className="text-xs text-destructive">That name is already used by another season.</p>}
          {setup.nextSeason ? (
            <p className="text-xs text-muted-foreground">
              Races the {setup.nextSeason.label} season: {fmt(setup.nextSeason.startDate)} – {fmt(setup.nextSeason.endDate)}.
            </p>
          ) : (
            <div className="flex gap-2 rounded-sm border border-amber-400/60 bg-amber-400/10 px-3 py-2 text-xs">
              <TriangleAlertIcon className="size-4 shrink-0 text-amber-500" />
              <p>
                The admins haven&apos;t set up the next season&apos;s races yet. You can start anyway: players will see a
                &quot;calendar not set&quot; note, and the league picks up the races as soon as the admins add the season.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- Players ---- */}
      <Card>
        <CardHeader>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Players ({roster.length})
          </h2>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Coming back. You always stay.</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setKeep(new Set(setup.members.map((m) => m.id)))}>
                  Reinvite all
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setKeep(new Set())}>
                  None
                </Button>
              </div>
            </div>
            <div className="divide-y divide-border rounded-sm border border-border">
              {setup.members.map((m) => (
                <label key={m.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={keep.has(m.id)} onChange={() => toggleKeep(m.id)} />
                  <LeaguePlayerAvatar userId={m.id} name={m.name} leagueId={leagueId} size="sm" action="none" />
                  <span className="truncate">{m.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Add players</p>
            <p className="text-xs text-muted-foreground">
              Past players of this league and people from your other leagues. They&apos;re added when the season starts.
            </p>
            {added.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {added.map((id) => (
                  <span key={id} className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-xs">
                    <PlayerAvatar userId={id} name={namesById.get(id) ?? ""} size="sm" />
                    {namesById.get(id)}
                    <button
                      type="button"
                      aria-label={`Don't add ${namesById.get(id)}`}
                      onClick={() => {
                        setAdded((prev) => prev.filter((x) => x !== id));
                        setAssign((prev) => Object.fromEntries(Object.entries(prev).filter(([u]) => u !== id)));
                      }}
                    >
                      <XIcon className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {setup.candidates.length > 0 ? (
              <>
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name" />
                <div className="max-h-56 overflow-y-auto divide-y divide-border rounded-sm border border-border">
                  {matches.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">No one matches.</p>
                  ) : (
                    matches.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <PlayerAvatar userId={c.id} name={c.name} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{c.name}</span>
                          <span className="block truncate text-[10px] text-muted-foreground">{c.from}</span>
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setAdded((prev) => [...prev, c.id])}>
                          <PlusIcon className="size-3.5 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No one to suggest yet. Share the invite link below.</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Invite new players</p>
            <p className="text-xs text-muted-foreground">
              Anyone who joins with this link shows up under &quot;Coming back&quot; when you reload this page.
            </p>
            <ConnectedInviteLink leagueId={leagueId} />
          </div>
        </CardContent>
      </Card>

      {/* ---- Teams ---- */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Teams ({teams.length})</h2>
            <div className="flex flex-wrap items-center justify-end gap-1">
              {undoDecouple && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTeams(undoDecouple);
                    setUndoDecouple(null);
                  }}
                >
                  <RotateCcwIcon className="size-3.5 mr-1" />
                  Undo decouple
                </Button>
              )}
              {!undoDecouple && !undoReset && hasFranchise && (
                <Button variant="ghost" size="sm" onClick={decoupleAll}>
                  <UnlinkIcon className="size-3.5 mr-1" />
                  Decouple all franchises
                </Button>
              )}
              {undoReset ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTeams(undoReset.teams);
                    setAssign(undoReset.assign);
                    setUndoReset(null);
                  }}
                >
                  <RotateCcwIcon className="size-3.5 mr-1" />
                  Undo reset
                </Button>
              ) : (
                teams.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={resetAll}>
                    <Trash2Icon className="size-3.5 mr-1" />
                    Reset all teams
                  </Button>
                )
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Kept teams carry on as the same franchise, even if you rename them. Click the × to uncouple one and it starts
            fresh. A new team can carry on one old franchise (even a deleted one) so its history continues. Deleted teams
            stay in the history book.
          </p>

          {teams.map((t) => (
            <div key={t.key} className="space-y-2 rounded-sm border border-border p-3">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={t.color}
                  onChange={(e) => updateTeam(t.key, { color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0.5 shrink-0"
                  title="Team color"
                />
                <Input value={t.name} maxLength={40} onChange={(e) => updateTeam(t.key, { name: e.target.value })} />
                <Button variant="ghost" size="icon" aria-label={`Delete ${t.name}`} onClick={() => deleteTeam(t.key)}>
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">{t.teamId ? "Kept from last season" : "New team"}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">Franchise:</span>
                {t.teamId ? (
                  // Kept team: it stays the franchise it already was.
                  <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
                    {pastTeamName.get(t.teamId) ?? t.name}
                    <button type="button" aria-label="Uncouple franchise" onClick={() => uncouple(t.key)}>
                      <XIcon className="size-3" />
                    </button>
                  </span>
                ) : t.previousTeamIds[0] ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
                    {pastTeamName.get(t.previousTeamIds[0]) ?? "Old team"}
                    <button type="button" aria-label="Uncouple franchise" onClick={() => updateTeam(t.key, { previousTeamIds: [] })}>
                      <XIcon className="size-3" />
                    </button>
                  </span>
                ) : (
                  <>
                    <span className="text-muted-foreground">None</span>
                    <Select value={NO_FRANCHISE} onValueChange={(id) => id !== NO_FRANCHISE && updateTeam(t.key, { previousTeamIds: [id] })}>
                      <SelectTrigger size="sm" className="w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_FRANCHISE}>Link to an old franchise…</SelectItem>
                        {setup.pastTeams
                          // Not a team still in this draft, and not one another new team already carries on.
                          .filter(
                            (p) =>
                              !teams.some((x) => x.teamId === p.teamId) &&
                              !teams.some((x) => x.key !== t.key && x.previousTeamIds.includes(p.teamId)),
                          )
                          .map((p) => (
                            <SelectItem key={p.teamId} value={p.teamId}>
                              {p.name} ({p.lastSeason})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
            </div>
          ))}

          <div className="flex gap-2">
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
              onKeyDown={(e) => e.key === "Enter" && addTeam()}
              placeholder="New team name"
              maxLength={40}
            />
            <Button variant="outline" onClick={addTeam} disabled={!newName.trim()}>
              <PlusIcon className="size-3.5 mr-1" />
              Add
            </Button>
          </div>
          {duplicateTeamName && <p className="text-xs text-destructive">Two teams have the same name.</p>}

          {teams.length > 0 && roster.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Who&apos;s on which team</p>
              <div className="divide-y divide-border rounded-sm border border-border">
                {roster.map((id) => (
                  <div
                    key={id}
                    className="flex items-center gap-3 border-l-4 px-3 py-2 text-sm"
                    style={{ borderLeftColor: teams.find((t) => t.key === assign[id])?.color ?? "transparent" }}
                  >
                    <PlayerAvatar userId={id} name={namesById.get(id) ?? ""} size="sm" />
                    <span className="min-w-0 flex-1 truncate">{namesById.get(id) ?? "Unknown player"}</span>
                    <Select
                      value={assign[id] && teams.some((t) => t.key === assign[id]) ? assign[id] : UNASSIGNED}
                      onValueChange={(key) =>
                        setAssign((prev) => {
                          const next = { ...prev };
                          if (key === UNASSIGNED) delete next[id];
                          else next[id] = key;
                          return next;
                        })
                      }
                    >
                      <SelectTrigger size="sm" className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED}>No team</SelectItem>
                        {teams.map((t) => (
                          <SelectItem key={t.key} value={t.key}>
                            <span className="inline-block size-2.5 rounded-full mr-1.5 align-middle" style={{ backgroundColor: t.color }} />
                            {t.name || "Unnamed team"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- Settings ---- */}
      <Card>
        <CardHeader>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Rules &amp; scoring</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="settings" checked={!changeSettings} onChange={() => setChangeSettings(false)} />
              Keep last season&apos;s settings
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="settings" checked={changeSettings} onChange={() => setChangeSettings(true)} />
              I want to change settings
            </label>
          </div>
          {changeSettings && (
            <div className="space-y-4 border-t border-border pt-4">
              <PlacementPointsEditor
                value={settings.placementPoints}
                onChange={(placementPoints) => setSettings((s) => ({ ...s, placementPoints }))}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1">Mulligans</span>
                <NumberInput value={settings.mulliganCount} onChange={(mulliganCount) => setSettings((s) => ({ ...s, mulliganCount }))} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1">Stages</span>
                <NumberInput value={settings.stageCount} onChange={(stageCount) => setSettings((s) => ({ ...s, stageCount }))} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1">Scoring depth</span>
                <NumberInput
                  value={settings.scoringDepth}
                  onChange={(scoringDepth) => setSettings((s) => ({ ...s, scoringDepth }))}
                  min={1}
                  nullable
                />
              </div>
              <PropPointValuesEditor
                values={settings.propPointValues}
                onChange={(propPointValues) => setSettings((s) => ({ ...s, propPointValues }))}
              />
              <TeamPositionPointsEditor
                value={settings.teamPositionPoints}
                onChange={(teamPositionPoints) => setSettings((s) => ({ ...s, teamPositionPoints }))}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Button size="lg" className="w-full" onClick={() => setConfirm(true)} disabled={!canStart || startMutation.isPending}>
        {startMutation.isPending && <Spinner className="w-3 h-3 mr-1" />}
        Start {trimmed || "next"} season
      </Button>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start the {trimmed} season?</AlertDialogTitle>
            <AlertDialogDescription>
              The {setup.currentLabel} season is saved to the history book and the standings start fresh with{" "}
              {roster.length} player{roster.length === 1 ? "" : "s"}
              {added.length > 0 ? ` (${added.length} new)` : ""}
              {removed > 0 ? `; ${removed} won't carry over` : ""}, {teams.length} team{teams.length === 1 ? "" : "s"}
              {changeSettings ? " and your new settings" : " and the same settings"}. Everyone gets a notification. You can
              still change all of this later, or go back to {setup.currentLabel} from the Season page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={start}>Start season</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
