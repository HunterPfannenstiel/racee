import { ScoreEntry, UserLeagueScores, TeamLeagueScores, PropKey, PropPointValues, PropName } from "@/lib/schemas";
import { Team } from "@/lib/schemas";

// Hardcoded rather than derived from PropNameSchema.options — same precedent as
// UserProfileStatsQuery.ts's PROP_NAMES. lib/schemas.ts pulls in server/domain/race.ts,
// which pulls in race-prediction-book.ts, which pulls in this file — importing the
// schema's runtime value here (rather than just its type) would close that cycle.
const PROP_NAMES: PropName[] = [
  "driverOfDay", "lapsLed", "fastestPitStop", "fastestLap",
  "overAchiever", "underAchiever", "wrecker",
];

/** One row per prop, in propKey's declared field order. */
export type PropPickBreakdown = {
  propName: PropName;
  pickedValue?: string;
  winners: string[] | null;
  correct: boolean;
  points: number;
};

/**
 * Per-prop detail behind computePropPoints's total — same winners-includes-pick
 * rule, just surfaced one row at a time instead of summed. computePropPoints is
 * a thin sum over this, so the two can never drift.
 */
export function computePropPointsBreakdown(
  picks: Record<string, string>,
  propKey: PropKey,
  propPointValues: PropPointValues,
): PropPickBreakdown[] {
  return (Object.entries(propKey) as [keyof PropKey, string[] | null][]).map(([prop, winners]) => {
    const pickedValue = picks[prop];
    const correct = !!winners && winners.length > 0 && winners.includes(pickedValue);
    return {
      propName: prop as PropName,
      pickedValue,
      winners,
      correct,
      points: correct ? propPointValues[prop] : 0,
    };
  });
}

export function computePropPoints(
  picks: Record<string, string>,
  propKey: PropKey,
  propPointValues: PropPointValues,
): number {
  return computePropPointsBreakdown(picks, propKey, propPointValues).reduce((sum, row) => sum + row.points, 0);
}

/** One row per actual finishing position (keyOrder's order), not per predicted slot. */
export type GridPositionBreakdown = {
  position: number;
  racerId: string;
  predictedPosition: number | null;
  scored: boolean;
  correct: boolean;
  points: number;
};

/**
 * Per-racer detail behind computeGridPoints's total. Rows are keyed by the
 * racer's actual finishing position (not the user's guessed slot) since a
 * racer's point contribution is a property of that racer, not of whichever
 * (possibly different) racer the user happened to guess for the same slot.
 * computeGridPoints is a thin sum over this, so the two can never drift.
 */
export function computeGridPointsBreakdown(
  userOrder: string[],
  keyOrder: string[],
  placementPoints: number[],
  scoringDepth: number | undefined,
): GridPositionBreakdown[] {
  const depth = scoringDepth ?? keyOrder.length;
  return keyOrder.map((racerId, position) => {
    const userPos = userOrder.indexOf(racerId);
    const predictedPosition = userPos === -1 ? null : userPos;
    const scored = predictedPosition !== null && predictedPosition < depth;
    const diff = predictedPosition !== null ? Math.abs(position - predictedPosition) : null;
    const points = scored && diff !== null && diff < placementPoints.length ? placementPoints[diff] : 0;
    return { position, racerId, predictedPosition, scored, correct: diff === 0, points };
  });
}

export function computeGridPoints(userOrder: string[], keyOrder: string[], placementPoints: number[], scoringDepth: number | undefined): number {
  return computeGridPointsBreakdown(userOrder, keyOrder, placementPoints, scoringDepth)
    .reduce((sum, row) => sum + row.points, 0);
}

/** Sorts entries desc by totalOf and groups consecutive equal-total entries together. */
function groupByTiedTotal<T>(entries: T[], totalOf: (entry: T) => number): T[][] {
  const sorted = [...entries].sort((a, b) => totalOf(b) - totalOf(a));
  const groups: T[][] = [];
  let i = 0;
  while (i < sorted.length) {
    const score = totalOf(sorted[i]);
    let j = i;
    while (j < sorted.length && totalOf(sorted[j]) === score) j++;
    groups.push(sorted.slice(i, j));
    i = j;
  }
  return groups;
}

export function assignMedals(entries: Omit<ScoreEntry, "medal">[]): ScoreEntry[] {
  const total = (e: Omit<ScoreEntry, "medal">) => e.gridPoints + e.propPoints;
  const podium = ["gold", "silver", "bronze"] as const;
  const groups = groupByTiedTotal(entries, total);

  return groups.flatMap((group, groupIdx) => {
    const medal = groupIdx < podium.length ? podium[groupIdx] : null;
    return group.map((entry) => ({ ...entry, medal }));
  });
}

/**
 * Competition-style shared ranking: tied entries (per totalOf) get the same
 * rank, and the next distinct group's rank skips ahead by the tie-group size
 * (1,1,3,4,4,6 — not 1,1,2).
 */
export function assignRanks<T>(entries: T[], totalOf: (entry: T) => number): (T & { rank: number })[] {
  const groups = groupByTiedTotal(entries, totalOf);
  let idx = 0;
  return groups.flatMap((group) => {
    const rank = idx + 1;
    idx += group.length;
    return group.map((entry) => ({ ...entry, rank }));
  });
}

export function computeScoreStats(entries: ScoreEntry[]): {
  average: number;
  highest: { value: number; userIds: string[] };
  lowest: { value: number; userIds: string[] };
} {
  if (entries.length === 0) {
    return { average: 0, highest: { value: 0, userIds: [] }, lowest: { value: 0, userIds: [] } };
  }
  const totals = entries.map((e) => ({ userId: e.userId, total: e.gridPoints + e.propPoints }));
  const average = totals.reduce((sum, t) => sum + t.total, 0) / totals.length;
  const highestValue = Math.max(...totals.map((t) => t.total));
  const lowestValue = Math.min(...totals.map((t) => t.total));
  return {
    average,
    highest: { value: highestValue, userIds: totals.filter((t) => t.total === highestValue).map((t) => t.userId) },
    lowest: { value: lowestValue, userIds: totals.filter((t) => t.total === lowestValue).map((t) => t.userId) },
  };
}

/** Ties break by PropName's declared enum order — the first prop encountered at the max hit-rate wins. */
export function computeBestPropBet(
  picks: Partial<Record<PropName, string>>[],
  propKey: PropKey,
): { prop: PropName; hitRate: number } | null {
  let best: { prop: PropName; hitRate: number } | null = null;
  for (const prop of PROP_NAMES) {
    const winners = propKey[prop];
    if (!winners || winners.length === 0) continue;
    const pickers = picks.filter((p) => p[prop] !== undefined);
    if (pickers.length === 0) continue;
    const hits = pickers.filter((p) => winners.includes(p[prop] as string)).length;
    const hitRate = hits / pickers.length;
    if (!best || hitRate > best.hitRate) best = { prop, hitRate };
  }
  return best;
}

function applyMulligans(raceScores: { gridPoints: number; propPoints: number }[], mulliganCount: number) {
  const combined = (s: { gridPoints: number; propPoints: number }) => s.gridPoints + s.propPoints;
  const sorted = [...raceScores].sort((a, b) => combined(a) - combined(b));
  const mulliganed = raceScores.length > mulliganCount ? mulliganCount : 0;
  const total = sorted.slice(mulliganed).reduce((sum, s) => sum + combined(s), 0);
  return { total, mulliganed };
}

export function getMulliganedRaceIds(raceScores: { raceId: string; gridPoints: number; propPoints: number }[], mulliganCount: number): Set<string> {
  if (raceScores.length <= mulliganCount) return new Set();
  return new Set(
    [...raceScores].sort((a, b) => (a.gridPoints + a.propPoints) - (b.gridPoints + b.propPoints)).slice(0, mulliganCount).map((r) => r.raceId)
  );
}

export function computeTeamRaceScores(entries: ScoreEntry[], teams: Team[]) {
  return teams
    .filter((team) => team.memberIds.some((id) => entries.some((e) => e.userId === id)))
    .map((team) => {
      const members = entries.filter((e) => team.memberIds.includes(e.userId));
      return {
        teamId: team.id,
        gridPoints: members.reduce((sum, e) => sum + e.gridPoints, 0),
        propPoints: members.reduce((sum, e) => sum + e.propPoints, 0),
      };
    });
}

export function computeWeeklyTeamPoints(
  entries: Array<{ userId: string; total: number }>,
  positionPoints: number[],
): Map<string, number> {
  const groups = groupByTiedTotal(entries, (e) => e.total);
  const result = new Map<string, number>();

  let idx = 0;
  for (const group of groups) {
    const pool = positionPoints.slice(idx, idx + group.length).reduce((sum, v) => sum + v, 0);
    const share = pool / group.length;
    for (const entry of group) result.set(entry.userId, share);
    idx += group.length;
  }

  return result;
}

export function computeSeasonStandings(individual: UserLeagueScores[], mulliganCount: number) {
  return individual
    .map(({ userId, raceScores }) => ({ userId, ...applyMulligans(raceScores, mulliganCount) }))
    .sort((a, b) => b.total - a.total);
}

export function computeTeamSeasonStandings(teams: TeamLeagueScores[], mulliganCount: number) {
  return teams
    .map(({ teamId, raceScores }) => ({ teamId, ...applyMulligans(raceScores, mulliganCount) }))
    .sort((a, b) => b.total - a.total);
}
