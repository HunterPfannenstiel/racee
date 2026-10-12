"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilIcon, PlusIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import { orpc } from "@/lib/orpc/client";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { QueryLoading, QueryError } from "@/components/ui/query-state";

type Draft = { seasonId?: string; label: string; startDate: string; endDate: string };

function errorMessage(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}

function nextDraft(last: { label: string; endDate: string } | undefined): Draft {
  const year = last ? Number(last.endDate.slice(0, 4)) + 1 : new Date().getFullYear();
  return { label: String(year), startDate: `${year}-01-01`, endDate: `${year}-12-31` };
}

const fmt = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/**
 * Admin → Seasons: each motorsport's seasons with a start and end date. A race
 * belongs to the season its date falls in, and every league races exactly one
 * season, so next season can be set up as far ahead as you like.
 */
export default function AdminSeasonsPage() {
  const queryClient = useQueryClient();
  const motorsportsQuery = useQuery(orpc.motorsports.list.queryOptions());
  const [pickedId, setPickedId] = useState<string | null>(null);
  const motorsportId = pickedId ?? motorsportsQuery.data?.[0]?.id ?? null;
  const seasonsQuery = useQuery(
    orpc.motorsports.seasons.queryOptions({ input: { motorsportId: motorsportId ?? "" }, enabled: !!motorsportId }),
  );
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSaved = () => {
    setDraft(null);
    setError(null);
    queryClient.invalidateQueries({ queryKey: orpc.motorsports.key() });
    queryClient.invalidateQueries({ queryKey: orpc.races.key() });
    queryClient.invalidateQueries({ queryKey: orpc.standings.key() });
    queryClient.invalidateQueries({ queryKey: orpc.history.key() });
  };
  const save = useMutation(
    orpc.motorsports.saveSeason.mutationOptions({ onSuccess: onSaved, onError: (e) => setError(errorMessage(e, "Couldn't save the season.")) }),
  );
  const remove = useMutation(
    orpc.motorsports.deleteSeason.mutationOptions({ onSuccess: onSaved, onError: (e) => setError(errorMessage(e, "Couldn't delete the season.")) }),
  );

  const data = seasonsQuery.data;
  const seasons = data?.seasons ?? [];

  return (
    <PageShell title="Seasons">
      <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Admin
      </Link>

      <p className="text-sm text-muted-foreground">
        Each season has a start and end date, and a race counts in the season its date falls in. Leagues only ever see the
        season they&apos;re racing, so you can add next season&apos;s races as early as you like without touching the
        season in progress. Leagues that started a new season before it was set up here pick it up automatically.
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>✕</Button>
          </AlertDescription>
        </Alert>
      )}

      {(motorsportsQuery.data?.length ?? 0) > 1 && (
        <div className="flex flex-wrap gap-1">
          {motorsportsQuery.data!.map((m) => (
            <button
              key={m.id}
              onClick={() => { setPickedId(m.id); setDraft(null); }}
              className={`font-mono text-sm font-semibold uppercase tracking-[0.06em] px-4 min-h-[44px] rounded-md transition-colors ${
                m.id === motorsportId ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      {motorsportsQuery.isPending || (!!motorsportId && seasonsQuery.isPending) ? (
        <QueryLoading />
      ) : motorsportsQuery.isError ? (
        <QueryError error={motorsportsQuery.error} onRetry={() => motorsportsQuery.refetch()} />
      ) : seasonsQuery.isError ? (
        <QueryError error={seasonsQuery.error} onRetry={() => seasonsQuery.refetch()} />
      ) : data ? (
        <div className="space-y-4">
          {data.leaguesWaiting > 0 && (
            <div className="flex gap-3 rounded-sm border border-amber-400/60 bg-amber-400/10 px-4 py-3 text-sm">
              <TriangleAlertIcon className="size-4 shrink-0 text-amber-500 mt-0.5" />
              <p>
                {data.leaguesWaiting} league{data.leaguesWaiting === 1 ? " has" : "s have"} started a new season that
                isn&apos;t set up yet. Add it below and they&apos;ll move onto it.
              </p>
            </div>
          )}
          {data.racesOutsideSeasons > 0 && (
            <p className="text-xs text-muted-foreground">
              {data.racesOutsideSeasons} race{data.racesOutsideSeasons === 1 ? " falls" : "s fall"} outside every season and
              won&apos;t show in leagues that are racing a season.
            </p>
          )}

          <Card>
            <CardHeader>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Seasons</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {seasons.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No seasons yet. Add the season being raced now first, then the next one.
                </p>
              )}
              {seasons.map((s) =>
                draft?.seasonId === s.seasonId ? (
                  <SeasonForm
                    key={s.seasonId}
                    draft={draft}
                    onChange={setDraft}
                    onCancel={() => setDraft(null)}
                    onSave={() => motorsportId && save.mutate({ motorsportId, ...draft })}
                    saving={save.isPending}
                  />
                ) : (
                  <div key={s.seasonId} className="flex items-center gap-3 rounded-sm border border-border px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{s.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmt(s.startDate)} – {fmt(s.endDate)} · {s.raceCount} race{s.raceCount === 1 ? "" : "s"} ·{" "}
                        {s.leagueCount} league{s.leagueCount === 1 ? "" : "s"} racing it
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${s.label}`}
                      onClick={() => setDraft({ seasonId: s.seasonId, label: s.label, startDate: s.startDate, endDate: s.endDate })}
                    >
                      <PencilIcon className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${s.label}`}
                      disabled={remove.isPending || s.leagueCount > 0}
                      title={s.leagueCount > 0 ? "Leagues are racing this season" : undefined}
                      onClick={() => motorsportId && remove.mutate({ motorsportId, seasonId: s.seasonId })}
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                ),
              )}

              {draft && !draft.seasonId ? (
                <SeasonForm
                  draft={draft}
                  onChange={setDraft}
                  onCancel={() => setDraft(null)}
                  onSave={() => motorsportId && save.mutate({ motorsportId, ...draft })}
                  saving={save.isPending}
                />
              ) : (
                <Button variant="outline" onClick={() => setDraft(nextDraft(seasons[seasons.length - 1]))}>
                  <PlusIcon className="size-3.5 mr-1" />
                  Add season
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </PageShell>
  );
}

function SeasonForm({
  draft,
  onChange,
  onCancel,
  onSave,
  saving,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const valid = draft.label.trim() && draft.startDate && draft.endDate && draft.endDate >= draft.startDate;
  return (
    <div className="space-y-3 rounded-sm border border-primary/60 p-3">
      <label className="block space-y-1">
        <span className="text-xs text-muted-foreground">Name</span>
        <Input value={draft.label} maxLength={40} onChange={(e) => onChange({ ...draft, label: e.target.value })} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Starts</span>
          <Input type="date" value={draft.startDate} onChange={(e) => onChange({ ...draft, startDate: e.target.value })} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Ends</span>
          <Input type="date" value={draft.endDate} onChange={(e) => onChange({ ...draft, endDate: e.target.value })} />
        </label>
      </div>
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={!valid || saving}>
          {saving && <Spinner className="w-3 h-3 mr-1" />}
          Save
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
      </div>
    </div>
  );
}
