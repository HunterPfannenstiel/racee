import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueMember } from "@/server/roles/league";
import type {
  ILeagueRepository,
  ITeamRepository,
  IRacerRepository,
  IRaceRepository,
  IUserRepository,
  IRacePredictionBookRepository,
} from "@/server/repositories";
import type {
  IUserPastRacesQuery,
  UserPastRacesResult,
  PastRaceDTO,
  RacerDTO,
} from "./IUserPastRacesQuery";

/**
 * Reads the current user's own past (locked/graded) race predictions for a
 * league, for the read-only "locked" prediction UI. Mirrors
 * UserOpenRacesQuery's loading pattern, but filters to past races and only
 * projects the requesting user's own pick — no teammate lineup/picks, since
 * those are open-races-only concepts. Still composes the team + user
 * repositories because `submittedByName` resolution needs to recognize when
 * a teammate submitted on the user's behalf. Unprefixed — composes the
 * league, team, racer, race, user, and prediction-book repositories.
 */
export class UserPastRacesQuery implements IUserPastRacesQuery {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly teams: ITeamRepository,
    private readonly racers: IRacerRepository,
    private readonly races: IRaceRepository,
    private readonly users: IUserRepository,
    private readonly books: IRacePredictionBookRepository,
  ) {}

  async execute(userId: string, leagueId: string): Promise<UserPastRacesResult> {
    const now = new Date();

    // Round 1: league (for membership enforcement) + racers + teams in parallel
    const [league, allRacers, teams] = await Promise.all([
      this.leagues.findById(leagueId),
      this.racers.findAll(),
      this.teams.findAllForLeague(leagueId),
    ]);

    if (!league) throw new NotFoundError("League", leagueId);
    assertLeagueMember(userId, league);

    // Resolve team membership (needed only to recognize a teammate as the
    // submitter of a proxy pick — teammates' own picks aren't exposed here)
    const userTeam = teams.find((t) => t.memberIds.includes(userId));
    const teammateIds = userTeam
      ? userTeam.memberIds.filter((id) => id !== userId)
      : [];

    // Round 2: races + teammate names in parallel
    const [races, teammateUsers] = await Promise.all([
      this.races.findAllForMotorsport(league.motorsportId),
      teammateIds.length > 0
        ? this.users.findByIds([...teammateIds])
        : Promise.resolve([]),
    ]);

    const userNameMap = new Map(teammateUsers.map((u) => [u.userId, u.name]));

    // Filter to past races
    const pastRacesList = races.filter(
      (race) =>
        race.startingGrid.length > 0 &&
        (race.isLocked(now) || race.keySetAt !== null),
    );

    // Round 3: prediction books for past races in one batched call
    const books = await this.books.findAllForRaces(
      leagueId,
      pastRacesList.map((race) => race.raceId),
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

    const pastRaces: PastRaceDTO[] = pastRacesList.map((race) => {
      const book = bookByRaceId.get(race.raceId);
      const pred = book?.predictionFor(userId);
      const myPick = pred
        ? {
            racerIds: [...pred.racerIds],
            propPicks: { ...pred.propPicks },
            submittedAt: pred.submittedAt,
            submittedBy: pred.submittedBy,
            submittedByName: resolveSubmitterName(pred.submittedBy),
          }
        : null;

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

    // Only include racers referenced by past race grids
    const usedRacerIds = new Set(pastRaces.flatMap((r) => r.startingGrid));
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

    return { pastRaces, racersById };
  }
}
