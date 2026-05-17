import { ScoreEntry, UserSeasonScores, TeamSeasonScores } from "@/lib/schemas";
import { Team } from "@/lib/schemas";

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

function applyMulligans(raceScores: { points: number }[]) {
  const sorted = [...raceScores].sort((a, b) => a.points - b.points);
  const mulliganed = raceScores.length > MULLIGAN_COUNT ? MULLIGAN_COUNT : 0;
  const total = sorted.slice(mulliganed).reduce((sum, s) => sum + s.points, 0);
  return { total, mulliganed };
}

export function computeTeamRaceScores(entries: ScoreEntry[], teams: Team[]) {
  return teams
    .filter((team) => team.memberIds.some((id) => entries.some((e) => e.userId === id)))
    .map((team) => ({
      teamId: team.id,
      points: entries
        .filter((e) => team.memberIds.includes(e.userId))
        .reduce((sum, e) => sum + e.gridPoints, 0),
    }));
}

export function computeSeasonStandings(individual: UserSeasonScores[]) {
  return individual
    .map(({ userId, raceScores }) => ({ userId, ...applyMulligans(raceScores) }))
    .sort((a, b) => b.total - a.total);
}

export function computeTeamSeasonStandings(teams: TeamSeasonScores[]) {
  return teams
    .map(({ teamId, raceScores }) => ({ teamId, ...applyMulligans(raceScores) }))
    .sort((a, b) => b.total - a.total);
}
