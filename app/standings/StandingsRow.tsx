import { Fragment } from "react";
import Link from "next/link";
import { type ReactNode } from "react";
import { type Race } from "@/lib/schemas";
import type { Medal } from "@/lib/medals";
import { medalColor } from "@/lib/colors";
import { StickyCell } from "./StickyCell";
import { RaceCell } from "./RaceCell";
import { formatPoints } from "@/lib/utils";
import { LeaguePlayerAvatar } from "@/components/avatar/LeaguePlayerAvatar";
import { TeamLogo } from "@/components/avatar/TeamLogo";
import { MovementBadge } from "./MovementBadge";

export type StandingsRowData = {
  id: string;
  /** Set on driver rows — whose avatar to show next to the name. */
  userId?: string;
  label: string;
  color: string;
  teamName?: string;
  /** The row's team (constructor rows) or the player's team (driver rows) — drives the team logo. */
  team?: { leagueId: string; id: string; name: string; color?: string | null; logo?: string | null };
  total: number;
  rawTotal: number;
  propTotal: number;
  /** Season-bet points already included in `total` (0 while hidden). */
  seasonBonus?: number;
  raceScores: Record<string, number>;
  /** Medal won in each race (players vs players, teams vs teams). */
  raceMedals?: Record<string, Medal>;
  mulliganedRaceIds: Set<string>;
  linkTo?: string;
  raceLinks?: Record<string, string>;
  memberScores?: { userId: string; name: string; total: number }[];
  /** Places gained (+) or lost (−) since the most recent race; null for new entries. */
  movement?: number | null;
};

type StandingsRowProps = {
  rank: number;
  row: StandingsRowData;
  races: Race[];
  leaderTotal: number;
  stageLastRaceIds: Set<string>;
  stageTotalsByRaceId: Record<string, number>;
  stageRanksByRaceId: Record<string, number>;
  seasonRank: number;
  showSummary: boolean;
  /** The league plays season bets: show the Bets column (a dash while the points are hidden). */
  bets?: { hidden: boolean; open: boolean };
};

function SummaryCell({ value, muted }: { value: ReactNode; muted?: boolean }) {
  return (
    <td className={`px-3 py-2 text-right font-mono text-xs whitespace-nowrap border-l border-border/30 ${muted ? "text-muted-foreground" : ""}`}>
      {value}
    </td>
  );
}

function StageCell({ value, rank }: { value: number; rank: boolean }) {
  const color = rank ? (medalColor[value] ?? "text-muted-foreground") : "";
  return (
    <td className={`px-3 py-2 text-right font-mono text-xs whitespace-nowrap border-l border-border/50 bg-muted/30 ${rank ? "font-semibold" : ""} ${color}`}>
      {rank ? value : formatPoints(value)}
    </td>
  );
}

export function StandingsRow({ rank, row, races, leaderTotal, stageLastRaceIds, stageTotalsByRaceId, stageRanksByRaceId, seasonRank, showSummary, bets }: StandingsRowProps) {
  const gap = leaderTotal - row.total;

  return (
    <tr className="border-t border-border/50">
      <StickyCell col="pos">
        <span className="flex items-center gap-1">
          <span className={`font-mono font-semibold ${medalColor[rank] ?? "text-muted-foreground"}`}>{rank}</span>
          <MovementBadge movement={row.movement} />
        </span>
      </StickyCell>

      <StickyCell col="name" color={row.color}>
        <span className="flex items-center gap-1.5 min-w-0">
          {row.userId ? (
            <LeaguePlayerAvatar userId={row.userId} name={row.label} size="sm" />
          ) : row.team ? (
            <TeamLogo leagueId={row.team.leagueId} teamId={row.team.id} name={row.team.name} color={row.team.color} logo={row.team.logo} size="sm" action="navigate" />
          ) : null}
          {row.linkTo ? (
            <Link href={row.linkTo} className="min-w-0 hover:text-primary transition-colors">
              {row.label}
            </Link>
          ) : (
            <span className="min-w-0">{row.label}</span>
          )}
        </span>
      </StickyCell>

      {bets && (
        <StickyCell col="bets" bets={bets.open ? "open" : "collapsed"} className="text-right">
          {bets.open && (
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {bets.hidden ? "—" : (row.seasonBonus ?? 0) > 0 ? `+${formatPoints(row.seasonBonus ?? 0)}` : "0"}
            </span>
          )}
        </StickyCell>
      )}

      <StickyCell col="total" bets={bets ? (bets.open ? "open" : "collapsed") : undefined}>
        <span className="font-semibold tabular-nums">{formatPoints(row.total)}</span>
      </StickyCell>

      {races.map((race) => {
        const points = row.raceScores[race.id] ?? null;
        const mulliganed = row.mulliganedRaceIds.has(race.id);
        return (
          <Fragment key={race.id}>
            <RaceCell points={points} mulliganed={mulliganed} href={row.raceLinks?.[race.id]} medal={row.raceMedals?.[race.id]} />
            {stageLastRaceIds.has(race.id) && (
              <>
                <StageCell value={stageTotalsByRaceId[race.id] ?? 0} rank={false} />
                <StageCell value={stageRanksByRaceId[race.id] ?? 0} rank={true} />
              </>
            )}
          </Fragment>
        );
      })}

      {showSummary && (
        <>
          <SummaryCell value={formatPoints(row.rawTotal)} />
          <SummaryCell value={formatPoints(row.total - (row.seasonBonus ?? 0) - row.propTotal)} />
          <SummaryCell value={formatPoints(row.propTotal)} />
          <SummaryCell value={formatPoints(row.rawTotal + row.propTotal)} />
          <SummaryCell value={<span className={medalColor[seasonRank] ?? "text-muted-foreground"}>{seasonRank}</span>} />
          <SummaryCell value={gap === 0 ? "—" : `-${formatPoints(gap)}`} muted={gap > 0} />
        </>
      )}
    </tr>
  );
}
