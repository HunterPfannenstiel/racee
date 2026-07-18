import { describe, it, expect } from "vitest";
import { gradeLeagueRace } from "@/server/services/grading";
import { League } from "@/server/domain/league";
import { Race } from "@/server/domain/race";
import { RacePredictionBook } from "@/server/domain/race-prediction-book";
import { LeagueStandings } from "@/server/domain/league-standings";
import { Team } from "@/server/domain/team";

const LEAGUE_ID = "11111111-1111-4111-8111-111111111111";
const MOTORSPORT_ID = "22222222-2222-4222-8222-222222222222";
const RACE_ID = "33333333-3333-4333-8333-333333333333";

const VER = "44444444-4444-4444-8444-444444444444";
const LEC = "55555555-5555-4555-8555-555555555555";
const NOR = "66666666-6666-4666-8666-666666666666";

const TEAM_ID = "77777777-7777-4777-8777-777777777777";
const OTHER = "88888888-8888-4888-8888-888888888888"; // not on the grid/key — always scores 0 grid points

function makeLeague(overrides: Partial<ConstructorParameters<typeof League>[0]> = {}) {
  return new League({
    leagueId: LEAGUE_ID,
    commissionerId: "commissioner",
    name: "Test League",
    placementPoints: [10, 7, 3],
    mulliganCount: 0,
    motorsportId: MOTORSPORT_ID,
    propPointValues: {
      driverOfDay: 5,
      lapsLed: 5,
      fastestPitStop: 5,
      fastestLap: 5,
      overAchiever: 5,
      underAchiever: 5,
      wrecker: 5,
    },
    ...overrides,
  });
}

function makeRace(overrides: Partial<ConstructorParameters<typeof Race>[0]> = {}) {
  return new Race({
    raceId: RACE_ID,
    motorsportId: MOTORSPORT_ID,
    title: "Test Grand Prix",
    date: "2026-05-01",
    startingGrid: [VER, LEC, NOR],
    keyOrder: [VER, LEC, NOR],
    propKey: {
      driverOfDay: null,
      lapsLed: null,
      fastestPitStop: null,
      fastestLap: null,
      overAchiever: null,
      underAchiever: null,
      wrecker: null,
    },
    keySetAt: "2026-05-01T20:00:00.000Z",
    ...overrides,
  });
}

describe("gradeLeagueRace", () => {
  it("grades grid points into the book's scores", () => {
    const league = makeLeague();
    const race = makeRace();
    const book = RacePredictionBook.empty(LEAGUE_ID, RACE_ID);
    book.submitPrediction("alice", [VER, LEC, NOR], {}, "2026-04-30T00:00:00.000Z");
    // Bob predicts VER 1st, NOR 2nd, LEC 3rd — VER exact (10), NOR one off (7), LEC one off (7)
    book.submitPrediction("bob", [VER, NOR, LEC], {}, "2026-04-30T00:00:00.000Z");
    const standings = LeagueStandings.empty(LEAGUE_ID);

    gradeLeagueRace(league, race, book, standings, []);

    expect(book.isGraded).toBe(true);
    const aliceEntry = book.scores!.entryFor("alice")!;
    const bobEntry = book.scores!.entryFor("bob")!;
    expect(aliceEntry.gridPoints).toBe(30); // 10 + 10 + 10, exact order
    expect(bobEntry.gridPoints).toBe(24); // 10 + 7 + 7
  });

  it("grades prop points into the book's scores", () => {
    const league = makeLeague();
    const race = makeRace({
      propKey: {
        driverOfDay: [VER],
        lapsLed: null,
        fastestPitStop: null,
        fastestLap: null,
        overAchiever: null,
        underAchiever: null,
        wrecker: null,
      },
    });
    const book = RacePredictionBook.empty(LEAGUE_ID, RACE_ID);
    book.submitPrediction("alice", [VER, LEC, NOR], { driverOfDay: VER }, "2026-04-30T00:00:00.000Z");
    book.submitPrediction("bob", [VER, LEC, NOR], { driverOfDay: LEC }, "2026-04-30T00:00:00.000Z");
    const standings = LeagueStandings.empty(LEAGUE_ID);

    gradeLeagueRace(league, race, book, standings, []);

    expect(book.scores!.entryFor("alice")!.propPoints).toBe(5);
    expect(book.scores!.entryFor("bob")!.propPoints).toBe(0);
  });

  // NOTE: weekly team points are never written back onto the book's own scores — the legacy
  // per-league grading helper only fed the weekly-team-points-enriched RaceScores into
  // `standings.incorporateRaceResult`, and `gradeLeagueRace` preserves that exactly. So these
  // assertions read from `standings`, not `book.scores` (which stays at the default 0).
  it("applies weekly team points into standings when the league configures them", () => {
    const league = makeLeague({ teamPositionPoints: [22, 17, 14] });
    const race = makeRace();
    const book = RacePredictionBook.empty(LEAGUE_ID, RACE_ID);
    // alice: exact order → 30 pts, highest total → gets the 1st-place (22pt) weekly team points
    book.submitPrediction("alice", [VER, LEC, NOR], {}, "2026-04-30T00:00:00.000Z");
    // bob: predicts a racer that isn't in the key at all → 0 pts, lowest total → gets the
    // 2nd-place (17pt) weekly team points (only 2 participants, so the 14pt slot goes unused)
    book.submitPrediction("bob", [OTHER], {}, "2026-04-30T00:00:00.000Z");
    const standings = LeagueStandings.empty(LEAGUE_ID);

    gradeLeagueRace(league, race, book, standings, []);

    expect(book.scores!.entryFor("alice")!.weeklyTeamPoints).toBe(0); // book itself never gets it
    expect(standings.individual.find((u) => u.userId === "alice")!.raceScores[0].weeklyTeamPoints).toBe(22);
    expect(standings.individual.find((u) => u.userId === "bob")!.raceScores[0].weeklyTeamPoints).toBe(17);
  });

  it("leaves weeklyTeamPoints at 0 in standings when the league has no teamPositionPoints configured", () => {
    const league = makeLeague();
    const race = makeRace();
    const book = RacePredictionBook.empty(LEAGUE_ID, RACE_ID);
    book.submitPrediction("alice", [VER, LEC, NOR], {}, "2026-04-30T00:00:00.000Z");
    const standings = LeagueStandings.empty(LEAGUE_ID);

    gradeLeagueRace(league, race, book, standings, []);

    expect(standings.individual.find((u) => u.userId === "alice")!.raceScores[0].weeklyTeamPoints).toBe(0);
  });

  it("incorporates the race result into individual and team standings", () => {
    const league = makeLeague({ teamPositionPoints: [22, 17] });
    const race = makeRace();
    const book = RacePredictionBook.empty(LEAGUE_ID, RACE_ID);
    book.submitPrediction("alice", [VER, LEC, NOR], {}, "2026-04-30T00:00:00.000Z");
    book.submitPrediction("bob", [OTHER], {}, "2026-04-30T00:00:00.000Z");
    const standings = LeagueStandings.empty(LEAGUE_ID);
    const team = new Team({ teamId: TEAM_ID, leagueId: LEAGUE_ID, name: "Team Alice", memberIds: ["alice"] });

    gradeLeagueRace(league, race, book, standings, [team]);

    expect(standings.gradedRaceIds).toEqual([RACE_ID]);

    const aliceScores = standings.individual.find((u) => u.userId === "alice")!;
    expect(aliceScores.raceScores).toHaveLength(1);
    expect(aliceScores.raceScores[0]).toMatchObject({ raceId: RACE_ID, gridPoints: 30, propPoints: 0, weeklyTeamPoints: 22 });

    const bobScores = standings.individual.find((u) => u.userId === "bob")!;
    expect(bobScores.raceScores[0]).toMatchObject({ raceId: RACE_ID, gridPoints: 0, propPoints: 0, weeklyTeamPoints: 17 });

    // Only "alice" is on a team — the team's race score should mirror hers, and
    // "bob" (not on any team) contributes nothing to team standings.
    const teamScores = standings.teams.find((t) => t.teamId === TEAM_ID)!;
    expect(teamScores.raceScores).toHaveLength(1);
    expect(teamScores.raceScores[0]).toMatchObject({ raceId: RACE_ID, weeklyTeamPoints: 22 });
  });

  it("re-grading the same race replaces rather than double-counts standings", () => {
    const league = makeLeague();
    const race = makeRace();
    const book = RacePredictionBook.empty(LEAGUE_ID, RACE_ID);
    book.submitPrediction("alice", [VER, LEC, NOR], {}, "2026-04-30T00:00:00.000Z");
    const standings = LeagueStandings.empty(LEAGUE_ID);

    // First grading (e.g. the initial key set)
    gradeLeagueRace(league, race, book, standings, []);
    // A correction comes in — key is re-set, book is regraded, and the command
    // re-runs gradeLeagueRace against the SAME LeagueStandings instance.
    const correctedRace = makeRace({ keyOrder: [LEC, VER, NOR] });
    gradeLeagueRace(league, correctedRace, book, standings, []);

    expect(standings.gradedRaceIds).toEqual([RACE_ID]); // not [RACE_ID, RACE_ID]
    const aliceScores = standings.individual.find((u) => u.userId === "alice")!;
    expect(aliceScores.raceScores).toHaveLength(1); // replaced, not appended
    // VER predicted 1st, finished 2nd → 7; LEC predicted 2nd, finished 1st → 7; NOR exact → 10 = 24
    expect(aliceScores.raceScores[0].gridPoints).toBe(24);
  });
});
