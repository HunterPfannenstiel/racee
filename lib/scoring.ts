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
  for (let keyPos = 0; keyPos < Math.min(keyOrder.length, depth); keyPos++) {
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
