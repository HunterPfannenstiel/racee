import { RaceScores } from "@/server/domain/race-prediction-book";
import type { RacePredictionBook } from "@/server/domain/race-prediction-book";
import type { LeagueStandings } from "@/server/domain/league-standings";
import { computeWeeklyTeamPoints } from "@/lib/scoring";
import type { Team } from "@/server/domain/team";
import type { League } from "@/server/domain/league";
import type { Race } from "@/server/domain/race";

/**
 * Grades one league's prediction book against a race's answer key, applies
 * weekly team points on top of the graded scores, and incorporates the
 * result into the league's standings. Mutates `book` and `standings` in
 * place via their own methods — the caller is responsible for loading these
 * entities beforehand and persisting them afterward.
 *
 * Extracted faithfully from the legacy PredictionService's per-league
 * grading helper and its weekly-team-points helper — preserve numeric
 * behavior exactly, this is scoring math that feeds league standings.
 */
export function gradeLeagueRace(
  league: League,
  race: Race,
  book: RacePredictionBook,
  standings: LeagueStandings,
  teams: Team[],
): void {
  const raceScores = applyWeeklyTeamPoints(book.grade(league, race), league.teamPositionPoints);

  const teamMembership = buildTeamMembership(teams);
  const activeTeamIds = new Set(teams.map(t => t.teamId));
  standings.incorporateRaceResult(raceScores, activeTeamIds, teamMembership);
}

function buildTeamMembership(teams: Team[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const team of teams) {
    for (const userId of team.memberIds) map.set(userId, team.teamId);
  }
  return map;
}

function applyWeeklyTeamPoints(scores: RaceScores, positionPoints: readonly number[] | undefined): RaceScores {
  if (!positionPoints || positionPoints.length === 0) return scores;

  const submitted = scores.entries.map(e => ({ userId: e.userId, total: e.total }));
  const weeklyMap = computeWeeklyTeamPoints(submitted, positionPoints as number[]);

  return new RaceScores({
    raceId: scores.raceId,
    leagueId: scores.leagueId,
    raceTitle: scores.raceTitle,
    raceDate: scores.raceDate,
    entries: scores.entries.map(e => ({
      userId: e.userId,
      gridPoints: e.gridPoints,
      propPoints: e.propPoints,
      medal: e.medal,
      weeklyTeamPoints: weeklyMap.get(e.userId) ?? 0,
    })),
  });
}
