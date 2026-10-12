"use client";

import Link from "next/link";
import type { PropName } from "@/lib/schemas";
import { cn, formatPoints } from "@/lib/utils";
import { medalColor } from "@/lib/colors";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TeamLogo } from "@/components/avatar/TeamLogo";
import { LeaguePlayerAvatar } from "@/components/avatar/LeaguePlayerAvatar";
import { TeamLogoUpload } from "@/components/avatar/TeamLogoUpload";
import { useState } from "react";
import type {
  PropAccuracyStat,
  TeamDashboardResult,
  TeamMemberStatsDTO,
  TeamSummaryDTO,
} from "@/server/queries/team-dashboard/ITeamDashboardQuery";

const PROP_LABELS: Record<PropName, string> = {
  driverOfDay: "Driver of Day",
  lapsLed: "Laps Led",
  fastestPitStop: "Fastest Pit Stop",
  fastestLap: "Fastest Lap",
  overAchiever: "Over Achiever",
  underAchiever: "Under Achiever",
  wrecker: "Wrecker",
};

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{children}</h2>;
}

// ---------------------------------------------------------------------------

export function TeamSwitcher({
  leagueId,
  teams,
  selectedId,
  viewerTeamId,
  onSelect,
}: {
  leagueId: string;
  teams: TeamSummaryDTO[];
  selectedId: string;
  viewerTeamId: string | null;
  onSelect: (id: string) => void;
}) {
  if (teams.length < 2) return null;
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {teams.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t.id)}
          aria-pressed={t.id === selectedId}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-full border px-2 py-1 pr-3 text-sm transition-colors",
            t.id === selectedId ? "border-primary bg-primary-subtle text-foreground" : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          <TeamLogo leagueId={leagueId} teamId={t.id} name={t.name} color={t.color} logo={t.logo} size="sm" />
          <span className="max-w-32 truncate">{t.name}</span>
          {t.id === viewerTeamId && <span className="text-[10px] uppercase tracking-widest text-primary">You</span>}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function TeamHeader({ leagueId, data }: { leagueId: string; data: TeamDashboardResult }) {
  const team = data.team!;
  const rank = data.teamScoringEnabled
    ? team.teamRank
    : data.leagueTeams.findIndex((t) => t.id === team.id) + 1;
  return (
    <div className="flex items-center gap-4">
      {data.canEditLogo ? (
        <TeamLogoUpload leagueId={leagueId} team={team} size="2xl" />
      ) : (
        <TeamLogo leagueId={leagueId} teamId={team.id} name={team.name} color={team.color} logo={team.logo} size="2xl" action="zoom" />
      )}
      <div className="min-w-0">
        <p className="font-heading text-3xl font-bold leading-tight text-foreground truncate">{team.name}</p>
        {rank ? (
          <p className="font-mono text-sm text-muted-foreground">
            <span className={cn("font-semibold", medalColor[rank] ?? "text-foreground")}>{ordinal(rank)}</span> of{" "}
            {data.teamCount} teams
            {data.pointsBehindLeader > 0 ? ` · ${formatPoints(data.pointsBehindLeader)} behind the leader` : " · leading"}
          </p>
        ) : null}
        <div className="mt-2 flex -space-x-1.5">
          {data.members.map((m) => (
            <LeaguePlayerAvatar key={m.userId} userId={m.userId} name={m.name} leagueId={leagueId} size="sm" action="zoom" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function CompareChip({ label, value, leagueAvg, format }: { label: string; value: number; leagueAvg: number; format: (n: number) => string }) {
  const diff = value - leagueAvg;
  const better = diff > 0.0001;
  const worse = diff < -0.0001;
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-heading text-xl font-bold leading-tight text-foreground">{format(value)}</p>
      <p className={cn("mt-0.5 text-[10px] font-mono", better ? "text-green-500" : worse ? "text-red-500" : "text-muted-foreground")}>
        {better ? "▲ " : worse ? "▼ " : ""}
        league avg {format(leagueAvg)}
      </p>
    </div>
  );
}

export function TeamStatGrid({ data }: { data: TeamDashboardResult }) {
  const team = data.team!;
  const avgs = data.leagueAverages;
  const best = data.races.reduce<(typeof data.races)[number] | null>((b, r) => (!b || r.teamPoints > b.teamPoints ? r : b), null);
  return (
    <div className="grid grid-cols-2 gap-2">
      {data.teamScoringEnabled && (
        <>
          <CompareChip label="Constructor points" value={team.teamPoints} leagueAvg={avgs.teamPoints} format={formatPoints} />
          <CompareChip label="Constructor pts / race" value={team.avgTeamPointsPerRace} leagueAvg={avgs.avgTeamPointsPerRace} format={formatPoints} />
        </>
      )}
      <CompareChip label="Driver points" value={team.combinedDriverPoints} leagueAvg={avgs.combinedDriverPoints} format={formatPoints} />
      <CompareChip label="Driver pts / player" value={team.avgDriverPointsPerMember} leagueAvg={avgs.avgDriverPointsPerMember} format={formatPoints} />
      <CompareChip label="Prop accuracy" value={team.propAccuracy} leagueAvg={avgs.propAccuracy} format={pct} />
      {data.teamScoringEnabled && best && best.teamPoints > 0 && (
        <div className="rounded-lg border border-border bg-surface p-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Best constructor race</p>
          <p className="mt-0.5 font-heading text-xl font-bold leading-tight text-foreground">{formatPoints(best.teamPoints)}</p>
          <p className="mt-0.5 text-[10px] font-mono text-muted-foreground truncate">{best.title}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function ContributionSection({ leagueId, data }: { leagueId: string; data: TeamDashboardResult }) {
  const color = data.team?.color ?? "var(--primary)";
  const useTeamPoints = data.teamScoringEnabled && (data.team?.teamPoints ?? 0) > 0;
  const max = Math.max(1, ...data.members.map((m) => (useTeamPoints ? m.teamContribution : m.driverTotal)));
  return (
    <Card>
      <CardHeader>
        <SectionTitle>{useTeamPoints ? "Constructor points per teammate" : "Driver points per teammate"}</SectionTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.members.length === 0 && <p className="text-sm text-muted-foreground">No players on this team yet.</p>}
        {data.members.map((m, i) => {
          const value = useTeamPoints ? m.teamContribution : m.driverTotal;
          return (
            <div key={m.userId} className="flex items-center gap-3">
              <LeaguePlayerAvatar userId={m.userId} name={m.name} leagueId={leagueId} size="md" action="zoom" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <Link href={`/players/${m.userId}`} className="truncate text-sm font-medium hover:text-primary">
                    {m.name}
                    {i === 0 && data.members.length > 1 && <span className="ml-1.5 text-[10px] uppercase tracking-widest text-primary">MVP</span>}
                  </Link>
                  <span className="shrink-0 font-mono text-sm tabular-nums">
                    {formatPoints(value)}
                    {useTeamPoints && <span className="ml-1 text-xs text-muted-foreground">{pct(m.contributionShare)}</span>}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                  <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
                </div>
              </div>
            </div>
          );
        })}
        <p className="text-[10px] font-mono text-muted-foreground">
          {useTeamPoints
            ? "Constructor points each player has earned for this team, and their share of the team's total."
            : "Each player's season total in the driver standings."}
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-heading text-base font-bold leading-tight text-foreground">{value}</p>
      {sub && <p className="text-[10px] font-mono text-muted-foreground truncate">{sub}</p>}
    </div>
  );
}

function PropBars({ stats }: { stats: PropAccuracyStat[] }) {
  if (stats.length === 0) return <p className="text-xs text-muted-foreground">No graded props yet.</p>;
  return (
    <div className="space-y-2">
      {[...stats]
        .sort((a, b) => b.accuracy - a.accuracy)
        .map((s) => (
          <div key={s.propType}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">{PROP_LABELS[s.propType]}</span>
              <span className="text-xs font-bold tabular-nums">
                {pct(s.accuracy)} <span className="font-normal text-muted-foreground">{s.correct}/{s.total}</span>
              </span>
            </div>
            <div className="mt-0.5 h-1.5 w-full rounded-full bg-subtle">
              <div className="h-1.5 rounded-full bg-primary" style={{ width: pct(s.accuracy) }} />
            </div>
          </div>
        ))}
    </div>
  );
}

function MemberCard({ leagueId, m, teamScoring }: { leagueId: string; m: TeamMemberStatsDTO; teamScoring: boolean }) {
  const sharpest = m.propAccuracyByType.reduce<PropAccuracyStat | null>((b, s) => (!b || s.accuracy > b.accuracy ? s : b), null);
  return (
    <details className="group rounded-lg border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-3">
        <LeaguePlayerAvatar userId={m.userId} name={m.name} leagueId={leagueId} size="lg" action="zoom" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{m.name}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {formatPoints(m.driverTotal)} driver pts{m.driverRank ? ` · ${ordinal(m.driverRank)} in league` : ""}
          </p>
        </div>
        <span className="text-xs text-muted-foreground transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="space-y-4 border-t border-border p-3">
        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Driver pts / race" value={formatPoints(m.avgPerRace)} />
          <MiniStat label="Grid points" value={formatPoints(m.gridPoints)} />
          <MiniStat label="Prop points" value={formatPoints(m.propPoints)} />
          {teamScoring && <MiniStat label="Constructor points" value={formatPoints(m.teamContribution)} sub={`${pct(m.contributionShare)} of team`} />}
          <MiniStat label="Best race (driver)" value={m.bestRace ? formatPoints(m.bestRace.points) : "—"} sub={m.bestRace?.title} />
          <MiniStat label="Prop accuracy" value={pct(m.propAccuracy)} />
          <MiniStat label="Races" value={String(m.racesPredicted)} />
          <MiniStat label="Props called" value={String(m.propsCalled)} />
          <MiniStat label="Sharpest" value={sharpest ? pct(sharpest.accuracy) : "—"} sub={sharpest ? PROP_LABELS[sharpest.propType] : undefined} />
        </div>
        <PropBars stats={m.propAccuracyByType} />
        <Link href={`/players/${m.userId}`} className="block text-xs text-primary hover:underline">
          Full player profile →
        </Link>
      </div>
    </details>
  );
}

export function MembersSection({ leagueId, data }: { leagueId: string; data: TeamDashboardResult }) {
  return (
    <section className="space-y-2">
      <SectionTitle>Players</SectionTitle>
      {data.members.map((m) => (
        <MemberCard key={m.userId} leagueId={leagueId} m={m} teamScoring={data.teamScoringEnabled} />
      ))}
    </section>
  );
}

export function TeamPropsSection({ data }: { data: TeamDashboardResult }) {
  return (
    <Card>
      <CardHeader>
        <SectionTitle>Team prop accuracy</SectionTitle>
      </CardHeader>
      <CardContent>
        <PropBars stats={data.teamPropAccuracyByType} />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function SortHead({
  k,
  label,
  className,
  sort,
  onSort,
}: {
  k: CompareKey;
  label: string;
  className?: string;
  sort: { key: CompareKey; dir: "asc" | "desc" };
  onSort: (k: CompareKey) => void;
}) {
  const active = sort.key === k;
  return (
    <th className={cn("py-2", className)} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
      <button type="button" onClick={() => onSort(k)} className={cn("uppercase tracking-widest hover:text-foreground", active && "text-foreground")}>
        {label}
        {active && <span className="ml-0.5 text-[9px]">{sort.dir === "desc" ? "▼" : "▲"}</span>}
      </button>
    </th>
  );
}

type CompareKey = "place" | "name" | "teamPoints" | "avgTeamPointsPerRace" | "combinedDriverPoints" | "avgDriverPointsPerMember" | "propAccuracy";

export function LeagueComparison({
  leagueId,
  data,
  onSelect,
}: {
  leagueId: string;
  data: TeamDashboardResult;
  onSelect: (id: string) => void;
}) {
  const scoring = data.teamScoringEnabled;
  const [sort, setSort] = useState<{ key: CompareKey; dir: "asc" | "desc" }>({ key: "place", dir: "asc" });
  const placeOf = new Map(data.leagueTeams.map((t, i) => [t.id, i + 1]));
  const rows = [...data.leagueTeams].sort((a, b) => {
    const k = sort.key;
    const cmp =
      k === "place" ? placeOf.get(a.id)! - placeOf.get(b.id)! : k === "name" ? a.name.localeCompare(b.name) : (a[k] as number) - (b[k] as number);
    return (sort.dir === "asc" ? cmp : -cmp) || placeOf.get(a.id)! - placeOf.get(b.id)!;
  });
  // First tap: best first (A→Z for names, 1st place first); tap again to flip.
  const toggle = (key: CompareKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "place" || key === "name" ? "asc" : "desc" }));
  return (
    <Card>
      <CardHeader>
        <SectionTitle>Against the league</SectionTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-mono text-muted-foreground">
              <SortHead k="place" label="#" className="px-3 text-left" sort={sort} onSort={toggle} />
              <SortHead k="name" label="Team" className="px-1 text-left" sort={sort} onSort={toggle} />
              {scoring && <SortHead k="teamPoints" label="Constructor pts" className="px-2 text-right" sort={sort} onSort={toggle} />}
              {scoring && <SortHead k="avgTeamPointsPerRace" label="Con. / race" className="px-2 text-right" sort={sort} onSort={toggle} />}
              <SortHead k="combinedDriverPoints" label="Driver pts" className="px-2 text-right" sort={sort} onSort={toggle} />
              <SortHead k="avgDriverPointsPerMember" label="Driver / player" className="px-2 text-right" sort={sort} onSort={toggle} />
              <SortHead k="propAccuracy" label="Prop acc." className="px-3 text-right" sort={sort} onSort={toggle} />
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const place = placeOf.get(t.id)!;
              return (
                <tr
                  key={t.id}
                  onClick={() => onSelect(t.id)}
                  className={cn("cursor-pointer border-t border-border/50 hover:bg-subtle", t.id === data.team?.id && "bg-primary-subtle")}
                >
                  <td className={cn("px-3 py-2 font-mono font-semibold", medalColor[place] ?? "text-muted-foreground")}>{place}</td>
                  <td className="px-1 py-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <TeamLogo leagueId={leagueId} teamId={t.id} name={t.name} color={t.color} logo={t.logo} size="xs" />
                      <span className="max-w-28 truncate">{t.name}</span>
                    </span>
                  </td>
                  {scoring && <td className="px-2 py-2 text-right font-mono tabular-nums">{formatPoints(t.teamPoints)}</td>}
                  {scoring && <td className="px-2 py-2 text-right font-mono tabular-nums text-muted-foreground">{formatPoints(t.avgTeamPointsPerRace)}</td>}
                  <td className="px-2 py-2 text-right font-mono tabular-nums">{formatPoints(t.combinedDriverPoints)}</td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-muted-foreground">{formatPoints(t.avgDriverPointsPerMember)}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">{pct(t.propAccuracy)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="px-3 pb-3 text-[10px] font-mono text-muted-foreground">Tap a column to sort · tap a team to view it</p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------

export function RaceByRace({ leagueId, data }: { leagueId: string; data: TeamDashboardResult }) {
  if (data.races.length === 0) return null;
  const scoring = data.teamScoringEnabled;
  return (
    <Card>
      <CardHeader>
        <SectionTitle>Race by race</SectionTitle>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        {[...data.races].reverse().map((r) => (
          <div key={r.raceId} className="flex items-center gap-3 border-t border-border/50 px-4 py-2.5 first:border-t-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{r.title}</p>
              {r.topMember && (
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <LeaguePlayerAvatar userId={r.topMember.userId} name={r.topMember.name} leagueId={leagueId} size="xs" action="zoom" />
                  <span className="truncate">
                    Top: {r.topMember.name} ({formatPoints(r.topMember.points)})
                  </span>
                </p>
              )}
            </div>
            {scoring && r.rankThatRace && (
              <span className={cn("font-mono text-xs", medalColor[r.rankThatRace] ?? "text-muted-foreground")}>
                {ordinal(r.rankThatRace)}
              </span>
            )}
            {scoring && <span className="w-14 text-right font-mono text-sm font-semibold tabular-nums">{formatPoints(r.teamPoints)}</span>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
