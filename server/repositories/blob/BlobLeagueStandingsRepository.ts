import { z } from "zod";
import { blob } from "@/lib/blob";
import { standingsPath } from "@/lib/paths";
import {
  LeagueStandings,
  UserLeagueScores,
  TeamLeagueScores,
} from "@/server/domain/league-standings";
import type { UserRaceScore } from "@/server/domain/league-standings";
import { ParseError, PersistenceError } from "@/server/domain/errors";
import type { ILeagueStandingsRepository } from "../interfaces/ILeagueStandingsRepository";

const RaceScorePersistenceSchema = z.object({
  raceId: z.string().uuid(),
  gridPoints: z.number().int().min(0),
  propPoints: z.number().int().min(0),
  weeklyTeamPoints: z.number().min(0).default(0),
});

const StandingsPersistenceSchema = z.object({
  leagueId: z.string().uuid(),
  gradedRaceIds: z.array(z.string()),
  individual: z.array(
    z.object({
      userId: z.string(),
      raceScores: z.array(RaceScorePersistenceSchema),
    })
  ),
  teams: z.array(
    z.object({
      teamId: z.string(),
      raceScores: z.array(RaceScorePersistenceSchema),
    })
  ),
});
type StandingsPersistence = z.infer<typeof StandingsPersistenceSchema>;

function toDomain(raw: StandingsPersistence): LeagueStandings {
  const individual = raw.individual.map(
    u => new UserLeagueScores(u.userId, u.raceScores as UserRaceScore[])
  );
  const teams = raw.teams.map(
    t => new TeamLeagueScores(t.teamId, t.raceScores as UserRaceScore[])
  );
  return new LeagueStandings(raw.leagueId, raw.gradedRaceIds, individual, teams);
}

function toPersistence(standings: LeagueStandings): StandingsPersistence {
  return {
    leagueId: standings.leagueId,
    gradedRaceIds: [...standings.gradedRaceIds],
    individual: standings.individual.map(u => ({
      userId: u.userId,
      raceScores: u.raceScores.map(s => ({
        raceId: s.raceId,
        gridPoints: s.gridPoints,
        propPoints: s.propPoints,
        weeklyTeamPoints: s.weeklyTeamPoints,
      })),
    })),
    teams: standings.teams.map(t => ({
      teamId: t.teamId,
      raceScores: t.raceScores.map(s => ({
        raceId: s.raceId,
        gridPoints: s.gridPoints,
        propPoints: s.propPoints,
        weeklyTeamPoints: s.weeklyTeamPoints,
      })),
    })),
  };
}

export class BlobLeagueStandingsRepository implements ILeagueStandingsRepository {
  async findByLeague(leagueId: string): Promise<LeagueStandings | null> {
    const path = standingsPath(leagueId);
    let raw: unknown;
    try {
      raw = await blob.read<unknown>(path);
    } catch (e) {
      throw new PersistenceError("read", path, e);
    }
    if (raw === null) return null;
    try {
      return toDomain(StandingsPersistenceSchema.parse(raw));
    } catch (e) {
      throw new ParseError(path, e);
    }
  }

  async save(standings: LeagueStandings): Promise<void> {
    const path = standingsPath(standings.leagueId);
    try {
      await blob.write(path, toPersistence(standings));
    } catch (e) {
      throw new PersistenceError("write", path, e);
    }
  }
}
