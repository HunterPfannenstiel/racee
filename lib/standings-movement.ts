import { assignRanks } from "@/lib/scoring";

type MovementRow = { id: string; raceScores: Record<string, number> };

/** Season total with the `mulliganCount` lowest races dropped (same rule as the server's standings). */
function totalWithMulligans(scores: number[], mulliganCount: number): number {
  const sorted = [...scores].sort((a, b) => a - b);
  const dropped = scores.length > mulliganCount ? mulliganCount : 0;
  return sorted.slice(dropped).reduce((sum, s) => sum + s, 0);
}

/**
 * Places each row gained (+) or lost (−) since the most recent graded race:
 * the standings are recalculated without that race and the two rankings are
 * compared. Tied totals share a rank, so ties never show fake movement.
 *
 * Returns null for a row that had no scores before that race (new to the
 * standings), and an empty result until at least two races are graded.
 */
export function computeStandingsMovement(
  rows: readonly MovementRow[],
  orderedRaceIds: readonly string[],
  mulliganCount: number,
): Record<string, number | null> {
  const graded = orderedRaceIds.filter((rid) => rows.some((r) => r.raceScores[rid] !== undefined));
  if (graded.length < 2) return {};
  const latest = graded[graded.length - 1];

  const scoresFor = (row: MovementRow, skip?: string) =>
    graded.filter((rid) => rid !== skip && row.raceScores[rid] !== undefined).map((rid) => row.raceScores[rid]);

  const now = assignRanks(
    rows.map((r) => ({ id: r.id, total: totalWithMulligans(scoresFor(r), mulliganCount) })),
    (e) => e.total,
  );
  const before = assignRanks(
    rows
      .filter((r) => scoresFor(r, latest).length > 0)
      .map((r) => ({ id: r.id, total: totalWithMulligans(scoresFor(r, latest), mulliganCount) })),
    (e) => e.total,
  );
  const beforeRank = new Map(before.map((e) => [e.id, e.rank]));

  return Object.fromEntries(
    now.map((e) => {
      const prev = beforeRank.get(e.id);
      return [e.id, prev === undefined ? null : prev - e.rank];
    }),
  );
}
