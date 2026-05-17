import { ScoreEntry, RaceScores } from "@/lib/schemas";

const POINTS = [10, 7, 3] as const;
const MULLIGAN_COUNT = 2;

export function computeGridPoints(userOrder: string[], keyOrder: string[]): number {
  let total = 0;
  for (let keyPos = 0; keyPos < keyOrder.length; keyPos++) {
    const racerId = keyOrder[keyPos];
    const userPos = userOrder.indexOf(racerId);
    if (userPos === -1) continue;
    const diff = Math.abs(keyPos - userPos);
    total += diff < POINTS.length ? POINTS[diff] : 0;
  }
  return total;
}

export function assignMedals(entries: Omit<ScoreEntry, "medal">[]): ScoreEntry[] {
  const sorted = [...entries].sort((a, b) => b.gridPoints - a.gridPoints);
  const medals: ("gold" | "silver" | "bronze" | null)[] = new Array(sorted.length).fill(null);
  const podium = ["gold", "silver", "bronze"] as const;

  let podiumIdx = 0;
  let i = 0;
  while (i < sorted.length && podiumIdx < podium.length) {
    const score = sorted[i].gridPoints;
    let j = i;
    while (j < sorted.length && sorted[j].gridPoints === score) {
      medals[j] = podium[podiumIdx];
      j++;
    }
    podiumIdx++;
    i = j;
  }

  return sorted.map((entry, idx) => ({ ...entry, medal: medals[idx] }));
}

export function computeSeasonStandings(
  raceScores: RaceScores[]
): { userId: string; total: number; mulliganed: number }[] {
  const pointsMap = new Map<string, number[]>();

  for (const race of raceScores) {
    for (const entry of race.entries) {
      const arr = pointsMap.get(entry.userId) ?? [];
      arr.push(entry.gridPoints);
      pointsMap.set(entry.userId, arr);
    }
  }

  const standings = Array.from(pointsMap.entries()).map(([userId, scores]) => {
    const sorted = [...scores].sort((a, b) => a - b);
    const mulliganed = Math.min(MULLIGAN_COUNT, sorted.length);
    const total = sorted.slice(mulliganed).reduce((sum, p) => sum + p, 0);
    return { userId, total, mulliganed };
  });

  return standings.sort((a, b) => b.total - a.total);
}
