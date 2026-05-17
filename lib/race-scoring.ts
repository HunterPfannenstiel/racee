import { Race, RaceScores, SeasonStandings, Team } from "@/lib/schemas";
import { blob } from "@/lib/blob";
import { scoresPath, standingsPath } from "@/lib/paths";
import { computeGridPoints, assignMedals, computeTeamRaceScores } from "@/lib/scoring";

export async function scoreRaceAndUpdateStandings({
  seasonId,
  raceId,
  keyOrder,
  race,
  predictions,
  existingStandings,
  teams,
}: {
  seasonId: string;
  raceId: string;
  keyOrder: string[];
  race: Race;
  predictions: Record<string, string[]>;
  existingStandings: SeasonStandings | null;
  teams: Team[];
}) {
  const rawEntries = Object.entries(predictions).map(([userId, racerIds]) => ({
    userId,
    gridPoints: computeGridPoints(racerIds, keyOrder),
  }));
  const entries = assignMedals(rawEntries);
  const raceScores: RaceScores = { raceId, seasonId, raceTitle: race.title, raceDate: race.date, entries };
  const teamRaceScores = computeTeamRaceScores(entries, teams);

  const existing = existingStandings ?? { seasonId, gradedRaceIds: [], individual: [], teams: [] };
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
    const newScore = { raceId, points: entry.gridPoints };
    if (idx >= 0) {
      updatedIndividual[idx] = { ...updatedIndividual[idx], raceScores: [...updatedIndividual[idx].raceScores, newScore] };
    } else {
      updatedIndividual.push({ userId: entry.userId, raceScores: [newScore] });
    }
  }

  const updatedTeams = [...stripped.teams];
  for (const teamScore of teamRaceScores) {
    const idx = updatedTeams.findIndex((t) => t.teamId === teamScore.teamId);
    const newScore = { raceId, points: teamScore.points };
    if (idx >= 0) {
      updatedTeams[idx] = { ...updatedTeams[idx], raceScores: [...updatedTeams[idx].raceScores, newScore] };
    } else {
      updatedTeams.push({ teamId: teamScore.teamId, raceScores: [newScore] });
    }
  }

  const newStandings: SeasonStandings = {
    seasonId,
    gradedRaceIds: [...stripped.gradedRaceIds, raceId],
    individual: updatedIndividual,
    teams: updatedTeams,
  };

  await Promise.all([
    blob.write(scoresPath(seasonId, raceId), raceScores),
    blob.write(standingsPath(seasonId), newStandings),
  ]);
}
