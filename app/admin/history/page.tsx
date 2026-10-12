"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { orpc } from "@/lib/orpc/client";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QueryError, QueryLoading } from "@/components/ui/query-state";
import { AwardTally } from "@/components/trophies/AwardIcons";
import { formatPoints } from "@/lib/utils";

type DraftRow = {
  key: string;
  userId: string;
  name: string;
  rank: string;
  total: string;
  gross: string;
  gold: string;
  silver: string;
  bronze: string;
  wins: string;
  high: string;
  /** Teams only: comma-separated driver names. */
  members: string;
};

const blankRow = (): DraftRow => ({
  key: crypto.randomUUID(),
  userId: "",
  name: "",
  rank: "",
  total: "",
  gross: "",
  gold: "",
  silver: "",
  bronze: "",
  wins: "",
  high: "",
  members: "",
});

const num = (v: string): number | null => {
  const n = Number(v.trim());
  return v.trim() === "" || Number.isNaN(n) ? null : n;
};
const int = (v: string) => Math.max(0, Math.round(num(v) ?? 0));

const PLAYER_COLUMNS = "Name, Place, Points, Gross, Gold, Silver, Bronze, Wins, High score";
const TEAM_COLUMNS = "Team, Place, Points, Gold, Silver, Bronze, Wins, High score, Drivers (separated by ;)";

/** Turns pasted spreadsheet rows (comma or tab separated) into draft rows. */
function parsePasted(text: string, kind: "players" | "teams", users: { id: string; name: string }[]): DraftRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.split(/\t|,/).map((c) => c.trim()))
    .filter((cells) => cells[0] && !/^(name|team|player)$/i.test(cells[0]))
    .map((c) => {
      const row = blankRow();
      row.name = c[0];
      if (kind === "players") {
        [row.rank, row.total, row.gross, row.gold, row.silver, row.bronze, row.wins, row.high] = c.slice(1).concat(Array(8).fill(""));
        row.userId = users.find((u) => u.name.toLowerCase() === row.name.toLowerCase())?.id ?? "";
      } else {
        [row.rank, row.total, row.gold, row.silver, row.bronze, row.wins, row.high] = c.slice(1).concat(Array(7).fill(""));
        row.members = (c[8] ?? "").split(";").map((s) => s.trim()).filter(Boolean).join(", ");
      }
      return row;
    });
}

export default function AdminHistoryPage() {
  const queryClient = useQueryClient();
  const leaguesQuery = useQuery(orpc.leagues.listAll.queryOptions());
  const usersQuery = useQuery(orpc.users.list.queryOptions());
  const [leagueId, setLeagueId] = useState("");
  const historyQuery = useQuery(orpc.history.adminGet.queryOptions({ input: { leagueId }, enabled: !!leagueId }));
  const teamsQuery = useQuery(orpc.leagues.teams.list.queryOptions({ input: { leagueId }, enabled: !!leagueId }));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [players, setPlayers] = useState<DraftRow[]>([blankRow()]);
  const [teams, setTeams] = useState<DraftRow[]>([]);
  const [paste, setPaste] = useState<{ kind: "players" | "teams"; text: string } | null>(null);

  const users = usersQuery.data ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: orpc.history.key() });

  const importMutation = useMutation(
    orpc.history.importSeason.mutationOptions({
      onSuccess: () => {
        refresh();
        setNotice(`Saved the ${label.trim()} season.`);
        setLabel("");
        setPlayers([blankRow()]);
        setTeams([]);
      },
      onError: (e) => setError(e instanceof Error ? e.message : "Couldn't save the season."),
    }),
  );
  const deleteMutation = useMutation(
    orpc.history.deleteSeason.mutationOptions({
      onSuccess: refresh,
      onError: (e) => setError(e instanceof Error ? e.message : "Couldn't delete the season."),
    }),
  );

  const filledPlayers = players.filter((r) => r.name.trim());
  const filledTeams = teams.filter((r) => r.name.trim());
  const canSave = !!leagueId && !!label.trim() && filledPlayers.length > 0 && !importMutation.isPending;

  function save() {
    setError(null);
    setNotice(null);
    importMutation.mutate({
      leagueId,
      label: label.trim(),
      players: filledPlayers.map((r) => ({
        userId: r.userId || null,
        name: r.name.trim(),
        rank: num(r.rank) !== null ? Math.max(1, int(r.rank)) : null,
        total: num(r.total) ?? 0,
        gross: num(r.gross),
        medals: { gold: int(r.gold), silver: int(r.silver), bronze: int(r.bronze) },
        raceWins: num(r.wins) !== null ? int(r.wins) : null,
        highScore: num(r.high),
      })),
      teams: filledTeams.map((r) => ({
        teamId: teamsQuery.data?.find((t) => t.name.toLowerCase() === r.name.trim().toLowerCase())?.id ?? null,
        name: r.name.trim(),
        rank: num(r.rank) !== null ? Math.max(1, int(r.rank)) : null,
        total: num(r.total) ?? 0,
        medals: { gold: int(r.gold), silver: int(r.silver), bronze: int(r.bronze) },
        raceWins: num(r.wins) !== null ? int(r.wins) : null,
        highScore: num(r.high),
        memberNames: r.members.split(",").map((s) => s.trim()).filter(Boolean),
      })),
    });
  }

  const update = (kind: "players" | "teams", key: string, patch: Partial<DraftRow>) => {
    const set = kind === "players" ? setPlayers : setTeams;
    set((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };
  const removeRow = (kind: "players" | "teams", key: string) => {
    const set = kind === "players" ? setPlayers : setTeams;
    set((rows) => rows.filter((r) => r.key !== key));
  };

  const cell = "h-8 px-2 text-xs";
  const renderRows = (kind: "players" | "teams", rows: DraftRow[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="text-muted-foreground">
          <tr className="text-left">
            {kind === "players" && <th className="px-1 py-1">Account</th>}
            <th className="px-1 py-1">{kind === "players" ? "Name" : "Team"}</th>
            <th className="px-1 py-1">Place</th>
            <th className="px-1 py-1">Points</th>
            {kind === "players" && <th className="px-1 py-1" title="Without mulligans">Gross</th>}
            <th className="px-1 py-1">🥇</th>
            <th className="px-1 py-1">🥈</th>
            <th className="px-1 py-1">🥉</th>
            <th className="px-1 py-1">Wins</th>
            <th className="px-1 py-1">High</th>
            {kind === "teams" && <th className="px-1 py-1">Drivers</th>}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              {kind === "players" && (
                <td className="px-1 py-1">
                  <select
                    value={r.userId}
                    onChange={(e) => {
                      const u = users.find((x) => x.id === e.target.value);
                      update(kind, r.key, { userId: e.target.value, name: u ? u.name : r.name });
                    }}
                    className="h-8 w-36 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="">No account</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </td>
              )}
              <td className="px-1 py-1"><Input className={`${cell} w-36`} value={r.name} onChange={(e) => update(kind, r.key, { name: e.target.value })} /></td>
              {(kind === "players"
                ? (["rank", "total", "gross", "gold", "silver", "bronze", "wins", "high"] as const)
                : (["rank", "total", "gold", "silver", "bronze", "wins", "high"] as const)
              ).map((f) => (
                <td key={f} className="px-1 py-1">
                  <Input className={`${cell} w-16`} inputMode="decimal" value={r[f]} onChange={(e) => update(kind, r.key, { [f]: e.target.value })} />
                </td>
              ))}
              {kind === "teams" && (
                <td className="px-1 py-1"><Input className={`${cell} w-48`} value={r.members} placeholder="Name, Name" onChange={(e) => update(kind, r.key, { members: e.target.value })} /></td>
              )}
              <td className="px-1 py-1">
                <Button variant="ghost" size="icon" onClick={() => removeRow(kind, r.key)} aria-label="Remove row">
                  <Trash2 className="size-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <PageShell title="League History">
      <Link href="/admin" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
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
      {notice && (
        <Alert>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      {leaguesQuery.isPending ? (
        <QueryLoading />
      ) : leaguesQuery.isError ? (
        <QueryError error={leaguesQuery.error} onRetry={() => leaguesQuery.refetch()} />
      ) : (
        <div className="space-y-6">
          <select
            value={leagueId}
            onChange={(e) => setLeagueId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Choose a league…</option>
            {leaguesQuery.data.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          {leagueId && (
            <>
              <Card>
                <CardHeader>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Seasons in the history book</h2>
                </CardHeader>
                <CardContent className="space-y-2">
                  {historyQuery.isPending ? (
                    <QueryLoading />
                  ) : historyQuery.data ? (
                    historyQuery.data.seasons.map((s) => {
                      const champ = s.players.find((p) => p.rank === 1);
                      return (
                        <div key={s.seasonId} className="flex items-center gap-3 text-sm">
                          <span className="font-semibold w-20">{s.label}</span>
                          <span className="flex-1 min-w-0 truncate text-xs text-muted-foreground">
                            {s.status === "complete" ? `${s.players.length} players` : "Current season"}
                            {s.imported && " · imported"}
                            {champ && ` · champion ${champ.name} (${formatPoints(champ.total)})`}
                          </span>
                          {s.status === "complete" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${s.label}`}
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (window.confirm(`Delete the ${s.label} season from this league's history? This can't be undone.`)) {
                                  deleteMutation.mutate({ leagueId, seasonId: s.seasonId });
                                }
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Add a past season</h2>
                </CardHeader>
                <CardContent className="space-y-5">
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Season name, e.g. 2024" maxLength={40} />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Players</p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setPaste({ kind: "players", text: "" })}>Paste rows</Button>
                        <Button variant="outline" size="sm" onClick={() => setPlayers((r) => [...r, blankRow()])}>+ Row</Button>
                      </div>
                    </div>
                    {renderRows("players", players)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Teams (optional)</p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setPaste({ kind: "teams", text: "" })}>Paste rows</Button>
                        <Button variant="outline" size="sm" onClick={() => setTeams((r) => [...r, blankRow()])}>+ Row</Button>
                      </div>
                    </div>
                    {teams.length > 0 && renderRows("teams", teams)}
                    <p className="text-[11px] text-muted-foreground">
                      A team with the same name as a current team in this league is linked to it, so its franchise history adds up.
                    </p>
                  </div>

                  {paste && (
                    <div className="space-y-2 rounded-sm border border-border p-3">
                      <p className="text-xs text-muted-foreground">
                        Paste from a spreadsheet, one row per line, columns in this order:
                        <br />
                        <span className="font-mono">{paste.kind === "players" ? PLAYER_COLUMNS : TEAM_COLUMNS}</span>
                      </p>
                      <textarea
                        value={paste.text}
                        onChange={(e) => setPaste({ ...paste, text: e.target.value })}
                        rows={6}
                        className="w-full rounded-md border border-input bg-background p-2 font-mono text-xs"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const rows = parsePasted(paste.text, paste.kind, users);
                            const set = paste.kind === "players" ? setPlayers : setTeams;
                            set((existing) => [...existing.filter((r) => r.name.trim()), ...rows]);
                            setPaste(null);
                          }}
                        >
                          Add rows
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setPaste(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Button onClick={save} disabled={!canSave}>
                      {importMutation.isPending && <Spinner className="w-3 h-3 mr-1" />}
                      Save season
                    </Button>
                    {filledPlayers.length > 0 && (
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-2">
                        {filledPlayers.length} players ·
                        <AwardTally
                          counts={filledPlayers.reduce(
                            (c, r) => ({ gold: c.gold + int(r.gold), silver: c.silver + int(r.silver), bronze: c.bronze + int(r.bronze) }),
                            { gold: 0, silver: 0, bronze: 0 },
                          )}
                        />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Blank gross uses points; blank wins uses gold medals. Pick an account so the season shows on that
                    player&apos;s trophy shelf.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </PageShell>
  );
}
