import { Race, RaceScores, LeagueStandings, Team, PropKey, PropPointValues, PlacementPoints } from "@/lib/schemas";
import * as standingRepository from "@/server/repositories/standing";
import * as scoreRepository from "@/server/repositories/score";
import { computeGridPoints, assignMedals, computeTeamRaceScores } from "@/lib/scoring";

function computePropPoints(
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

export async function scoreRaceAndUpdateStandings({
  leagueId,
  raceId,
  keyOrder,
  race,
  predictions,
  propPicks,
  propKey,
  propPointValues,
  placementPoints,
  scoringDepth,
  existingStandings,
  teams,
}: {
  leagueId: string;
  raceId: string;
  keyOrder: string[];
  race: Race;
  predictions: Record<string, string[]>;
  propPicks: Record<string, Record<string, string>>;
  propKey: PropKey;
  propPointValues: PropPointValues;
  placementPoints: PlacementPoints;
  scoringDepth: number;
  existingStandings: LeagueStandings | null;
  teams: Team[];
}) {
  const rawEntries = Object.entries(predictions).map(([userId, racerIds]) => ({
    userId,
    gridPoints: computeGridPoints(racerIds, keyOrder, placementPoints, scoringDepth),
    propPoints: computePropPoints(propPicks[userId] ?? {}, propKey, propPointValues),
  }));
  const entries = assignMedals(rawEntries);
  const raceScores: RaceScores = { raceId, leagueId, raceTitle: race.title, raceDate: race.date, entries };
  const teamRaceScores = computeTeamRaceScores(entries, teams);

  const existing = existingStandings ?? { leagueId, gradedRaceIds: [], individual: [], teams: [] };
  const currentTeamIds = new Set(teams.map((t) => t.id));
  const stripped = {
    ...existing,
    gradedRaceIds: existing.gradedRaceIds.filter((id) => id !== raceId),
    individual: existing.individual.map((u) => ({
      ...u,
      raceScores: u.raceScores.filter((s) => s.raceId !== raceId),
    })),
    teams: existing.teams
      .filter((t) => currentTeamIds.has(t.teamId))
      .map((t) => ({
        ...t,
        raceScores: t.raceScores.filter((s) => s.raceId !== raceId),
      })),
  };

  const updatedIndividual = [...stripped.individual];
  for (const entry of entries) {
    const idx = updatedIndividual.findIndex((u) => u.userId === entry.userId);
    const newScore = { raceId, gridPoints: entry.gridPoints, propPoints: entry.propPoints };
    if (idx >= 0) {
      updatedIndividual[idx] = { ...updatedIndividual[idx], raceScores: [...updatedIndividual[idx].raceScores, newScore] };
    } else {
      updatedIndividual.push({ userId: entry.userId, raceScores: [newScore] });
    }
  }

  const updatedTeams = [...stripped.teams];
  for (const teamScore of teamRaceScores) {
    const idx = updatedTeams.findIndex((t) => t.teamId === teamScore.teamId);
    const newScore = { raceId, gridPoints: teamScore.gridPoints, propPoints: teamScore.propPoints };
    if (idx >= 0) {
      updatedTeams[idx] = { ...updatedTeams[idx], raceScores: [...updatedTeams[idx].raceScores, newScore] };
    } else {
      updatedTeams.push({ teamId: teamScore.teamId, raceScores: [newScore] });
    }
  }

  const newStandings: LeagueStandings = {
    leagueId,
    gradedRaceIds: [...stripped.gradedRaceIds, raceId],
    individual: updatedIndividual,
    teams: updatedTeams,
  };

  await Promise.all([
    scoreRepository.save(leagueId, raceId, raceScores),
    standingRepository.save(leagueId, newStandings),
  ]);
}
