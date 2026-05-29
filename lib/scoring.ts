import { ScoreEntry, UserLeagueScores, TeamLeagueScores } from "@/lib/schemas";
import { Team } from "@/lib/schemas";

export function computeGridPoints(userOrder: string[], keyOrder: string[], placementPoints: number[], scoringDepth: number): number {
  let total = 0;
  for (let keyPos = 0; keyPos < Math.min(keyOrder.length, scoringDepth); keyPos++) {
    const racerId = keyOrder[keyPos];
    const userPos = userOrder.indexOf(racerId);
    if (userPos === -1) continue;
    const diff = Math.abs(keyPos - userPos);
    total += diff < placementPoints.length ? placementPoints[diff] : 0;
  }
  return total;
}

export function assignMedals(entries: Omit<ScoreEntry, "medal">[]): ScoreEntry[] {
  const total = (e: Omit<ScoreEntry, "medal">) => e.gridPoints + e.propPoints;
  const sorted = [...entries].sort((a, b) => total(b) - total(a));
  const medals: ("gold" | "silver" | "bronze" | null)[] = new Array(sorted.length).fill(null);
  const podium = ["gold", "silver", "bronze"] as const;

  let podiumIdx = 0;
  let i = 0;
  while (i < sorted.length && podiumIdx < podium.length) {
    const score = total(sorted[i]);
    let j = i;
    while (j < sorted.length && total(sorted[j]) === score) {
      medals[j] = podium[podiumIdx];
      j++;
    }
    podiumIdx++;
    i = j;
  }

  return sorted.map((entry, idx) => ({ ...entry, medal: medals[idx] }));
}

function applyMulligans(raceScores: { points: number }[], mulliganCount: number) {
  const sorted = [...raceScores].sort((a, b) => a.points - b.points);
  const mulliganed = raceScores.length > mulliganCount ? mulliganCount : 0;
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
        .reduce((sum, e) => sum + e.gridPoints + e.propPoints, 0),
    }));
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
