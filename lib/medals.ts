/**
 * Race medals and season trophies.
 *
 * Medals follow the standings' competition ranking: a tie shares the place, and
 * the next place skips ahead (two golds → the next score gets bronze). Nobody
 * earns a medal for a 0-point race.
 */

export type Medal = "gold" | "silver" | "bronze";
export const MEDALS: readonly Medal[] = ["gold", "silver", "bronze"];

export type MedalCounts = { gold: number; silver: number; bronze: number };
export const emptyMedalCounts = (): MedalCounts => ({ gold: 0, silver: 0, bronze: 0 });

export function medalForRank(rank: number, points: number): Medal | null {
  if (points <= 0) return null;
  return MEDALS[rank - 1] ?? null;
}

export const MEDAL_LABEL: Record<Medal, string> = { gold: "Gold", silver: "Silver", bronze: "Bronze" };

/** Raw hex colors for the medal/trophy art. */
/** Award colors (matching the gold/silver/bronze art): body, highlight, outline and the number on it. */
export const MEDAL_HEX: Record<Medal, { fill: string; light: string; stroke: string; text: string }> = {
  gold: { fill: "#fcc42d", light: "#ffe27a", stroke: "#d9960b", text: "#a35f00" },
  silver: { fill: "#e3e6ec", light: "#f8f9fb", stroke: "#9aa0aa", text: "#4a505c" },
  bronze: { fill: "#f2a15c", light: "#f9c595", stroke: "#c4661f", text: "#8c3b0a" },
};

export const MEDAL_PLACE: Record<Medal, 1 | 2 | 3> = { gold: 1, silver: 2, bronze: 3 };

/** Competition rank (1,1,3…) of each entry by points, highest first. */
export function competitionRanks<T>(entries: readonly T[], pointsOf: (e: T) => number): Map<T, number> {
  const sorted = [...entries].sort((a, b) => pointsOf(b) - pointsOf(a));
  const ranks = new Map<T, number>();
  sorted.forEach((e, i) => {
    const prev = sorted[i - 1];
    ranks.set(e, prev !== undefined && pointsOf(prev) === pointsOf(e) ? ranks.get(prev)! : i + 1);
  });
  return ranks;
}

export type RaceMedalRow = { id: string; scores: Record<string, number> };

/**
 * Medals for every race: raceId → (row id → medal). Each race ranks the rows that
 * have a score for it. Rows are players or teams — whatever is being compared.
 */
export function computeRaceMedals(rows: readonly RaceMedalRow[]): Record<string, Record<string, Medal>> {
  const raceIds = new Set(rows.flatMap((r) => Object.keys(r.scores)));
  const out: Record<string, Record<string, Medal>> = {};
  for (const raceId of raceIds) {
    const entries = rows.filter((r) => r.scores[raceId] !== undefined);
    const ranks = competitionRanks(entries, (r) => r.scores[raceId]);
    const medals: Record<string, Medal> = {};
    for (const row of entries) {
      const medal = medalForRank(ranks.get(row)!, row.scores[raceId]);
      if (medal) medals[row.id] = medal;
    }
    out[raceId] = medals;
  }
  return out;
}

/** One row's medal tally across the given races. */
export function countRowMedals(medalsByRace: Record<string, Record<string, Medal>>, rowId: string): MedalCounts {
  const counts = emptyMedalCounts();
  for (const medals of Object.values(medalsByRace)) {
    const m = medals[rowId];
    if (m) counts[m]++;
  }
  return counts;
}

export function addMedalCounts(a: MedalCounts, b: MedalCounts): MedalCounts {
  return { gold: a.gold + b.gold, silver: a.silver + b.silver, bronze: a.bronze + b.bronze };
}

export function totalMedals(c: MedalCounts): number {
  return c.gold + c.silver + c.bronze;
}
