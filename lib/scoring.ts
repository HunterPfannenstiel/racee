import { ScoreEntry, UserLeagueScores, TeamLeagueScores, PropKey, PropPointValues } from "@/lib/schemas";
import { Team } from "@/lib/schemas";

export function computePropPoints(
  picks: Record<string, string>,
  propKey: PropKey,
  propPointValues: PropPointValues,
): number {
  let total = 0;
  for (const [prop, winners] of Object.entries(propKey) as [keyof PropKey, string[] | null][]) {
    if (!winners || winners.length === 0) continue;
    if (winners.includes(picks[prop])) total += propPointValues[prop];
  }
  return total;
}

export function computeGridPoints(userOrder: string[], keyOrder: string[], placementPoints: number[], scoringDepth: number | undefined): number {
  const depth = scoringDepth ?? keyOrder.length;
  let total = 0;
  for (let keyPos = 0; keyPos < keyOrder.length; keyPos++) {
    const racerId = keyOrder[keyPos];
    const userPos = userOrder.indexOf(racerId);
    if (userPos === -1) continue;
    if (userPos >= depth) continue;
    const diff = Math.abs(keyPos - userPos);
    total += diff < placementPoints.length ? placementPoints[diff] : 0;
  }
  return total;
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
