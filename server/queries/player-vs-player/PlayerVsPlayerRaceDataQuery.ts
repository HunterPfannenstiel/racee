import type {
  ILeagueRepository,
  IRaceRepository,
  IRacePredictionBookRepository,
  ITeamRepository,
  IUserRepository,
  IRacerRepository,
} from "@/server/repositories";
import type { Team } from "@/server/domain/team";
import { NotFoundError } from "@/server/domain/errors";
import { assignRanks, computeGridPointsBreakdown, computePropPointsBreakdown } from "@/lib/scoring";
import type { IPlayerVsPlayerRaceDataQuery, PvpRaceDataResult, PvpEntryDTO, RacerDTO } from "./IPlayerVsPlayerRaceDataQuery";

const DEFAULT_TEAM_COLOR = "#6b7280";

/**
 * Every league member's raw prediction, already-graded score, and per-pick
 * breakdown for one race — the full dataset a player-vs-player view needs,
 * fetched once regardless of which two members end up being compared
 * client-side. Unprefixed — composes the league, race, prediction-book,
 * team, user, and racer repositories.
 */
export class PlayerVsPlayerRaceDataQuery implements IPlayerVsPlayerRaceDataQuery {
  constructor(
    private leagues: ILeagueRepository,
    private races: IRaceRepository,
    private books: IRacePredictionBookRepository,
    private teams: ITeamRepository,
    private users: IUserRepository,
    private racers: IRacerRepository,
  ) {}

  async execute(leagueId: string, raceId: string): Promise<PvpRaceDataResult> {
    const league = await this.leagues.findById(leagueId);
    if (!league) throw new NotFoundError("League", leagueId);

    const [race, book, teams, allRacers, memberUsers] = await Promise.all([
      this.races.findById(league.motorsportId, raceId),
      this.books.findByRace(leagueId, raceId),
      this.teams.findAllForLeague(leagueId),
      this.racers.findAll(),
      this.users.findByIds([...league.memberIds]),
    ]);
    if (!race) throw new NotFoundError("Race", raceId);

    const namesById = new Map(memberUsers.map((u) => [u.userId, u.name]));

    const teamByUserId = new Map<string, Team>();
    for (const team of teams) {
      for (const memberId of team.memberIds) teamByUserId.set(memberId, team);
    }

    const scoreEntries = book?.scores?.entries ?? [];
    const ranked = assignRanks([...scoreEntries], (e) => e.gridPoints + e.propPoints);
    const rankedByUserId = new Map(ranked.map((e) => [e.userId, e]));
    const leaderTotal = ranked.length > 0 ? Math.max(...ranked.map((e) => e.gridPoints + e.propPoints)) : null;

    const racersById: Record<string, RacerDTO> = Object.fromEntries(
      allRacers.map((r) => [r.racerId, { id: r.racerId, name: r.name, team: r.constructorName, image: r.image, teamColor: r.teamColor }]),
    );

    const entries: PvpEntryDTO[] = league.memberIds.map((userId) => {
      const pred = book?.predictionFor(userId);
      const rankedEntry = rankedByUserId.get(userId);
      const team = teamByUserId.get(userId);

      const gridBreakdown = pred && race.keyOrder
        ? computeGridPointsBreakdown(pred.racerIds as string[], race.keyOrder as string[], league.placementPoints as number[], league.scoringDepth)
        : null;
      const propBreakdown = pred && race.propKey
        ? computePropPointsBreakdown(pred.propPicks as Record<string, string>, race.propKey, league.propPointValues)
        : null;

      return {
        userId,
        name: namesById.get(userId) ?? "Unknown",
        color: team?.color ?? DEFAULT_TEAM_COLOR,
        hasSubmitted: pred !== undefined,
        rank: rankedEntry?.rank ?? null,
        pointsBack: rankedEntry && leaderTotal !== null ? leaderTotal - (rankedEntry.gridPoints + rankedEntry.propPoints) : null,
        total: rankedEntry ? rankedEntry.gridPoints + rankedEntry.propPoints : null,
        gridPoints: rankedEntry?.gridPoints ?? null,
        propPoints: rankedEntry?.propPoints ?? null,
        medal: rankedEntry?.medal ?? null,
        gridPrediction: pred ? [...pred.racerIds] : null,
        propPicks: pred ? { ...pred.propPicks } : null,
        gridBreakdown,
        propBreakdown,
      };
    });

    return {
      race: {
        raceId: race.raceId,
        title: race.title,
        label: race.label,
        keyOrder: race.keyOrder ? [...race.keyOrder] : null,
        propKey: race.propKey,
      },
      league: {
        leagueId: league.leagueId,
        name: league.name,
        scoringDepth: league.scoringDepth,
        placementPoints: [...league.placementPoints],
        propPointValues: { ...league.propPointValues },
      },
      racersById,
      entries,
    };
  }
}
