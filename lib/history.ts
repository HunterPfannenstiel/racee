import { addMedalCounts, emptyMedalCounts, medalForRank, type MedalCounts } from "@/lib/medals";

/** Minimal season shape the career math needs (matches history.get's seasons). */
type SeasonLike = {
  status: "complete" | "ended" | "in_progress";
  players: {
    userId: string | null;
    name: string;
    rank: number | null;
    total: number;
    gross: number;
    highScore: number | null;
    medals: MedalCounts;
    raceWins: number;
  }[];
  teams: {
    teamId: string | null;
    name: string;
    color: string | null;
    rank: number | null;
    total: number;
    highScore: number | null;
    medals: MedalCounts;
    raceWins: number;
  }[];
};

export type CareerRow = {
  id: string;
  /** Set for players with an account. */
  userId: string | null;
  teamId: string | null;
  name: string;
  color: string | null;
  seasons: number;
  points: number;
  /** Players only: points without mulligans. */
  gross: number;
  highScore: number | null;
  bestFinish: number | null;
  avgFinish: number | null;
  trophies: MedalCounts;
  medals: MedalCounts;
  raceWins: number;
};

const isFinished = (s: SeasonLike) => s.status !== "in_progress";

function finish(row: Omit<CareerRow, "avgFinish">, finishes: number[]): CareerRow {
  return {
    ...row,
    avgFinish: finishes.length > 0 ? finishes.reduce((a, b) => a + b, 0) / finishes.length : null,
  };
}

/**
 * Career totals across seasons. Finishes and trophies only count finished
 * seasons; points, medals and wins include the season in progress.
 */
function aggregate<R extends SeasonLike["players"][number] | SeasonLike["teams"][number]>(
  seasons: readonly SeasonLike[],
  rowsOf: (s: SeasonLike) => readonly R[],
  keyOf: (r: R) => string,
  extra: (r: R) => { userId: string | null; teamId: string | null; color: string | null; gross: number },
): CareerRow[] {
  const acc = new Map<string, Omit<CareerRow, "avgFinish"> & { finishes: number[] }>();
  for (const season of seasons) {
    for (const r of rowsOf(season)) {
      const key = keyOf(r);
      const ex = extra(r);
      const cur =
        acc.get(key) ??
        {
          id: key,
          userId: ex.userId,
          teamId: ex.teamId,
          name: r.name,
          color: ex.color,
          seasons: 0,
          points: 0,
          gross: 0,
          highScore: null,
          bestFinish: null,
          trophies: emptyMedalCounts(),
          medals: emptyMedalCounts(),
          raceWins: 0,
          finishes: [],
        };
      cur.name = r.name; // most recent name wins (seasons come oldest first)
      if (ex.color) cur.color = ex.color;
      cur.seasons++;
      cur.points += r.total;
      cur.gross += ex.gross;
      if (r.highScore !== null) cur.highScore = Math.max(cur.highScore ?? r.highScore, r.highScore);
      cur.medals = addMedalCounts(cur.medals, r.medals);
      cur.raceWins += r.raceWins;
      if (isFinished(season) && r.rank !== null) {
        cur.finishes.push(r.rank);
        cur.bestFinish = Math.min(cur.bestFinish ?? r.rank, r.rank);
        const trophy = medalForRank(r.rank, r.total);
        if (trophy) cur.trophies[trophy]++;
      }
      acc.set(key, cur);
    }
  }
  return [...acc.values()].map(({ finishes, ...row }) => finish(row, finishes));
}

export function playerCareers(seasons: readonly SeasonLike[]): CareerRow[] {
  return aggregate(
    seasons,
    (s) => s.players,
    (p) => p.userId ?? `name:${p.name.toLowerCase()}`,
    (p) => ({ userId: p.userId, teamId: null, color: null, gross: p.gross }),
  );
}

/** Teams are followed by team id, so a kept ("franchise") team's history continues across seasons. */
export function teamCareers(seasons: readonly SeasonLike[]): CareerRow[] {
  return aggregate(
    seasons,
    (s) => s.teams,
    (t) => t.teamId ?? `name:${t.name.toLowerCase()}`,
    (t) => ({ userId: null, teamId: t.teamId, color: t.color, gross: t.total }),
  );
}
