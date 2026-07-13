import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueMember } from "@/server/roles/league";
import type { RacePredictionBook } from "@/server/domain/race-prediction-book";
import type {
  ILeagueRepository,
  ITeamRepository,
  IRacerRepository,
  IRaceRepository,
  IUserRepository,
  IRacePredictionBookRepository,
} from "@/server/repositories";
import type {
  IUserOpenRacesQuery,
  UserOpenRacesResult,
  OpenRaceDTO,
  RacerDTO,
  MyPickDTO,
  TeammateDTO,
} from "./IUserOpenRacesQuery";

/**
 * Reads the current user's open races, picks, and teammate lineup for a
 * league. Ported from the legacy `GET /api/predict/init` route (whose
 * `requireMember` guard is replaced below by loading the league through
 * `ILeagueRepository` and calling `assertLeagueMember` — see
 * server/rpc/routers/predictions.ts). Unprefixed — composes the league,
 * team, racer, race, user, and prediction-book repositories.
 */
export class UserOpenRacesQuery implements IUserOpenRacesQuery {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly teams: ITeamRepository,
    private readonly racers: IRacerRepository,
    private readonly races: IRaceRepository,
    private readonly users: IUserRepository,
    private readonly books: IRacePredictionBookRepository,
  ) {}

  async execute(userId: string, leagueId: string): Promise<UserOpenRacesResult> {
    const now = new Date();

    // Round 1: league (for membership enforcement) + racers + teams in parallel
    const [league, allRacers, teams] = await Promise.all([
      this.leagues.findById(leagueId),
      this.racers.findAll(),
      this.teams.findAllForLeague(leagueId),
    ]);

    if (!league) throw new NotFoundError("League", leagueId);
    assertLeagueMember(userId, league);

    // Resolve team membership
    const userTeam = teams.find((t) => t.memberIds.includes(userId));
    const teammateIds = userTeam
      ? userTeam.memberIds.filter((id) => id !== userId)
      : [];
    const teamColor = userTeam?.color;

    // Round 2: races + teammate names in parallel
    const [races, teammateUsers] = await Promise.all([
      this.races.findAllForMotorsport(league.motorsportId),
      teammateIds.length > 0
        ? this.users.findByIds([...teammateIds])
        : Promise.resolve([]),
    ]);

    const userNameMap = new Map(teammateUsers.map((u) => [u.userId, u.name]));

    const teammates: TeammateDTO[] = teammateIds
      .map((id) => ({ id, name: userNameMap.get(id) ?? id }));

    // Filter to open races
    const openRacesList = races.filter(
      (race) =>
        race.startingGrid.length > 0 &&
        !race.isLocked(now) &&
        race.keySetAt === null,
    );

    // Round 3: prediction books for open races in one batched call
    const books = await this.books.findAllForRaces(
      leagueId,
      openRacesList.map((race) => race.raceId),
    );
    const bookByRaceId = new Map(books.map((b) => [b.raceId, b]));

    // Build a name resolver for submittedBy (includes current user + teammates)
    const allRelevantIds = [userId, ...teammateIds];
    const resolveSubmitterName = (submitterId: string | null): string | null => {
      if (!submitterId) return null;
      if (!allRelevantIds.includes(submitterId)) return submitterId;
      if (submitterId === userId) return null;
      return userNameMap.get(submitterId) ?? submitterId;
    };

    const buildPickDTO = (
      book: RacePredictionBook | undefined,
      targetUserId: string,
    ): MyPickDTO | null => {
      const pred = book?.predictionFor(targetUserId);
      if (!pred) return null;
      return {
        racerIds: [...pred.racerIds],
        propPicks: { ...pred.propPicks },
        submittedAt: pred.submittedAt,
        submittedBy: pred.submittedBy,
        submittedByName: resolveSubmitterName(pred.submittedBy),
      };
    };

    // Project to OpenRaceDTOs + teammatePicks
    const teammatePicks: Record<string, Record<string, MyPickDTO>> = {};

    const openRaces: OpenRaceDTO[] = openRacesList.map((race) => {
      const book = bookByRaceId.get(race.raceId);

      const myPick = buildPickDTO(book, userId);

      // Extract teammate picks for this race
      if (teammateIds.length > 0) {
        const raceTeammatePicks: Record<string, MyPickDTO> = {};
        for (const tmId of teammateIds) {
          const pick = buildPickDTO(book, tmId);
          if (pick) raceTeammatePicks[tmId] = pick;
        }
        if (Object.keys(raceTeammatePicks).length > 0) {
          teammatePicks[race.raceId] = raceTeammatePicks;
        }
      }

      return {
        id: race.raceId,
        leagueId,
        title: race.title,
        label: race.label,
        date: race.date,
        lockTime: race.lockTime,
        startingGrid: [...race.startingGrid],
        keyIsSet: race.keySetAt !== null,
        myPick,
      };
    });

    // Only include racers referenced by open race grids
    const usedRacerIds = new Set(openRaces.flatMap((r) => r.startingGrid));
    const racersById: Record<string, RacerDTO> = {};
    for (const r of allRacers) {
      if (usedRacerIds.has(r.racerId)) {
        racersById[r.racerId] = {
          id: r.racerId,
          name: r.name,
          team: r.constructorName,
          image: r.image,
          teamColor: r.teamColor,
        };
      }
    }

    return { openRaces, racersById, teammates, teamColor, teammatePicks };
  }
}
