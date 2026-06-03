import type {
  IUserProfileStatsQuery,
  UserProfileStatsResult,
  RacePickEntryDTO,
  DeduplicatedPropPickDTO,
  PropAccuracyDTO,
  TrendPointDTO,
  RacerDTO,
} from "./IUserProfileStatsQuery";
import type { PropName } from "@/lib/schemas";

// ─── Racer registry ───────────────────────────────────────────────────────────
// Each driver gets a stable UUID used consistently across all pick data.

const RACERS: Record<string, RacerDTO> = {
  "d1a2b3c4-0001-0001-0001-000000000001": {
    id: "d1a2b3c4-0001-0001-0001-000000000001",
    name: "Max Verstappen",
    team: "Red Bull Racing",
    teamColor: "#3671C6",
  },
  "d1a2b3c4-0002-0002-0002-000000000002": {
    id: "d1a2b3c4-0002-0002-0002-000000000002",
    name: "Sergio Perez",
    team: "Red Bull Racing",
    teamColor: "#3671C6",
  },
  "d1a2b3c4-0003-0003-0003-000000000003": {
    id: "d1a2b3c4-0003-0003-0003-000000000003",
    name: "Lewis Hamilton",
    team: "Ferrari",
    teamColor: "#E8002D",
  },
  "d1a2b3c4-0004-0004-0004-000000000004": {
    id: "d1a2b3c4-0004-0004-0004-000000000004",
    name: "Charles Leclerc",
    team: "Ferrari",
    teamColor: "#E8002D",
  },
  "d1a2b3c4-0005-0005-0005-000000000005": {
    id: "d1a2b3c4-0005-0005-0005-000000000005",
    name: "George Russell",
    team: "Mercedes",
    teamColor: "#27F4D2",
  },
  "d1a2b3c4-0006-0006-0006-000000000006": {
    id: "d1a2b3c4-0006-0006-0006-000000000006",
    name: "Kimi Antonelli",
    team: "Mercedes",
    teamColor: "#27F4D2",
  },
  "d1a2b3c4-0007-0007-0007-000000000007": {
    id: "d1a2b3c4-0007-0007-0007-000000000007",
    name: "Lando Norris",
    team: "McLaren",
    teamColor: "#FF8000",
  },
  "d1a2b3c4-0008-0008-0008-000000000008": {
    id: "d1a2b3c4-0008-0008-0008-000000000008",
    name: "Oscar Piastri",
    team: "McLaren",
    teamColor: "#FF8000",
  },
  "d1a2b3c4-0009-0009-0009-000000000009": {
    id: "d1a2b3c4-0009-0009-0009-000000000009",
    name: "Fernando Alonso",
    team: "Aston Martin",
    teamColor: "#229971",
  },
  "d1a2b3c4-0010-0010-0010-000000000010": {
    id: "d1a2b3c4-0010-0010-0010-000000000010",
    name: "Lance Stroll",
    team: "Aston Martin",
    teamColor: "#229971",
  },
  "d1a2b3c4-0011-0011-0011-000000000011": {
    id: "d1a2b3c4-0011-0011-0011-000000000011",
    name: "Nico Hulkenberg",
    team: "Sauber",
    teamColor: "#52E252",
  },
  "d1a2b3c4-0012-0012-0012-000000000012": {
    id: "d1a2b3c4-0012-0012-0012-000000000012",
    name: "Carlos Sainz",
    team: "Williams",
    teamColor: "#64C4FF",
  },
};

// Shorthand aliases for use in pick data below
const VER = "d1a2b3c4-0001-0001-0001-000000000001"; // Max Verstappen
const PER = "d1a2b3c4-0002-0002-0002-000000000002"; // Sergio Perez
const HAM = "d1a2b3c4-0003-0003-0003-000000000003"; // Lewis Hamilton
const LEC = "d1a2b3c4-0004-0004-0004-000000000004"; // Charles Leclerc
const RUS = "d1a2b3c4-0005-0005-0005-000000000005"; // George Russell
const ANT = "d1a2b3c4-0006-0006-0006-000000000006"; // Kimi Antonelli
const NOR = "d1a2b3c4-0007-0007-0007-000000000007"; // Lando Norris
const PIA = "d1a2b3c4-0008-0008-0008-000000000008"; // Oscar Piastri
const ALO = "d1a2b3c4-0009-0009-0009-000000000009"; // Fernando Alonso
const STR = "d1a2b3c4-0010-0010-0010-000000000010"; // Lance Stroll
const HUL = "d1a2b3c4-0011-0011-0011-000000000011"; // Nico Hulkenberg
const SAI = "d1a2b3c4-0012-0012-0012-000000000012"; // Carlos Sainz

// ─── Pick feed ────────────────────────────────────────────────────────────────
// 10 graded races + 1 upcoming ungraded.
// Each prop pick has weight=1 (one prediction per prop per race).
// propWeightedAccuracy = correctPicks / totalPicks for that race.

const PICK_FEED: RacePickEntryDTO[] = [
  // ── Race 1: Australian GP — 3 leagues ──
  {
    raceId: "race-2025-01-aus",
    title: "Australian Grand Prix",
    date: "2025-03-16",
    leagueCount: 3,
    isGraded: true,
    propPicks: [
      // correct
      { propType: "driverOfDay", answer: NOR, weight: 1, isCorrect: true, correctAnswers: [NOR] },
      // correct
      { propType: "fastestLap", answer: VER, weight: 1, isCorrect: true, correctAnswers: [VER] },
      // wrong
      { propType: "lapsLed", answer: VER, weight: 1, isCorrect: false, correctAnswers: [NOR] },
      // correct
      { propType: "fastestPitStop", answer: NOR, weight: 1, isCorrect: true, correctAnswers: [NOR] },
      // wrong
      { propType: "overAchiever", answer: ALO, weight: 1, isCorrect: false, correctAnswers: [PIA] },
      // correct
      { propType: "underAchiever", answer: PER, weight: 1, isCorrect: true, correctAnswers: [PER] },
      // wrong
      { propType: "wrecker", answer: STR, weight: 1, isCorrect: false, correctAnswers: [HUL] },
    ],
    // 4 correct / 7 total
    propWeightedAccuracy: 4 / 7,
  },

  // ── Race 2: Chinese GP — 2 leagues ──
  {
    raceId: "race-2025-02-chn",
    title: "Chinese Grand Prix",
    date: "2025-03-23",
    leagueCount: 2,
    isGraded: true,
    propPicks: [
      // wrong
      { propType: "driverOfDay", answer: HAM, weight: 1, isCorrect: false, correctAnswers: [LEC] },
      // correct
      { propType: "fastestLap", answer: VER, weight: 1, isCorrect: true, correctAnswers: [VER] },
      // correct
      { propType: "lapsLed", answer: NOR, weight: 1, isCorrect: true, correctAnswers: [NOR] },
      // wrong
      { propType: "fastestPitStop", answer: RUS, weight: 1, isCorrect: false, correctAnswers: [PIA] },
      // correct
      { propType: "overAchiever", answer: ANT, weight: 1, isCorrect: true, correctAnswers: [ANT] },
      // correct
      { propType: "underAchiever", answer: STR, weight: 1, isCorrect: true, correctAnswers: [STR] },
      // wrong
      { propType: "wrecker", answer: ALO, weight: 1, isCorrect: false, correctAnswers: [PER] },
    ],
    // 4 correct / 7 total
    propWeightedAccuracy: 4 / 7,
  },

  // ── Race 3: Japanese GP — 2 leagues ──
  {
    raceId: "race-2025-03-jpn",
    title: "Japanese Grand Prix",
    date: "2025-04-06",
    leagueCount: 2,
    isGraded: true,
    propPicks: [
      // correct
      { propType: "driverOfDay", answer: VER, weight: 1, isCorrect: true, correctAnswers: [VER] },
      // correct
      { propType: "fastestLap", answer: NOR, weight: 1, isCorrect: true, correctAnswers: [NOR] },
      // correct
      { propType: "lapsLed", answer: VER, weight: 1, isCorrect: true, correctAnswers: [VER] },
      // correct
      { propType: "fastestPitStop", answer: LEC, weight: 1, isCorrect: true, correctAnswers: [LEC] },
      // wrong
      { propType: "overAchiever", answer: SAI, weight: 1, isCorrect: false, correctAnswers: [HUL] },
      // correct
      { propType: "underAchiever", answer: ALO, weight: 1, isCorrect: true, correctAnswers: [ALO] },
      // wrong
      { propType: "wrecker", answer: STR, weight: 1, isCorrect: false, correctAnswers: [ANT] },
    ],
    // 5 correct / 7 total
    propWeightedAccuracy: 5 / 7,
  },

  // ── Race 4: Bahrain GP — 2 leagues ──
  {
    raceId: "race-2025-04-bhr",
    title: "Bahrain Grand Prix",
    date: "2025-04-13",
    leagueCount: 2,
    isGraded: true,
    propPicks: [
      // wrong
      { propType: "driverOfDay", answer: NOR, weight: 1, isCorrect: false, correctAnswers: [HAM] },
      // wrong
      { propType: "fastestLap", answer: VER, weight: 1, isCorrect: false, correctAnswers: [RUS] },
      // correct
      { propType: "lapsLed", answer: LEC, weight: 1, isCorrect: true, correctAnswers: [LEC] },
      // wrong
      { propType: "fastestPitStop", answer: NOR, weight: 1, isCorrect: false, correctAnswers: [RUS] },
      // correct
      { propType: "overAchiever", answer: ANT, weight: 1, isCorrect: true, correctAnswers: [ANT] },
      // wrong
      { propType: "underAchiever", answer: PER, weight: 1, isCorrect: false, correctAnswers: [STR] },
      // correct
      { propType: "wrecker", answer: HUL, weight: 1, isCorrect: true, correctAnswers: [HUL] },
    ],
    // 3 correct / 7 total
    propWeightedAccuracy: 3 / 7,
  },

  // ── Race 5: Saudi Arabian GP — 2 leagues ──
  {
    raceId: "race-2025-05-ksa",
    title: "Saudi Arabian Grand Prix",
    date: "2025-04-20",
    leagueCount: 2,
    isGraded: true,
    propPicks: [
      // correct
      { propType: "driverOfDay", answer: PIA, weight: 1, isCorrect: true, correctAnswers: [PIA] },
      // correct
      { propType: "fastestLap", answer: NOR, weight: 1, isCorrect: true, correctAnswers: [NOR] },
      // correct
      { propType: "lapsLed", answer: NOR, weight: 1, isCorrect: true, correctAnswers: [NOR] },
      // correct
      { propType: "fastestPitStop", answer: PIA, weight: 1, isCorrect: true, correctAnswers: [PIA] },
      // wrong
      { propType: "overAchiever", answer: HUL, weight: 1, isCorrect: false, correctAnswers: [SAI] },
      // correct
      { propType: "underAchiever", answer: PER, weight: 1, isCorrect: true, correctAnswers: [PER] },
      // wrong
      { propType: "wrecker", answer: ALO, weight: 1, isCorrect: false, correctAnswers: [STR] },
    ],
    // 5 correct / 7 total
    propWeightedAccuracy: 5 / 7,
  },

  // ── Race 6: Miami GP — 3 leagues ──
  {
    raceId: "race-2025-06-mia",
    title: "Miami Grand Prix",
    date: "2025-05-04",
    leagueCount: 3,
    isGraded: true,
    propPicks: [
      // wrong
      { propType: "driverOfDay", answer: HAM, weight: 1, isCorrect: false, correctAnswers: [NOR] },
      // correct
      { propType: "fastestLap", answer: VER, weight: 1, isCorrect: true, correctAnswers: [VER] },
      // wrong
      { propType: "lapsLed", answer: LEC, weight: 1, isCorrect: false, correctAnswers: [NOR] },
      // correct
      { propType: "fastestPitStop", answer: NOR, weight: 1, isCorrect: true, correctAnswers: [NOR] },
      // correct
      { propType: "overAchiever", answer: ANT, weight: 1, isCorrect: true, correctAnswers: [ANT] },
      // wrong
      { propType: "underAchiever", answer: ALO, weight: 1, isCorrect: false, correctAnswers: [PER] },
      // correct
      { propType: "wrecker", answer: HUL, weight: 1, isCorrect: true, correctAnswers: [HUL] },
    ],
    // 4 correct / 7 total
    propWeightedAccuracy: 4 / 7,
  },

  // ── Race 7: Emilia Romagna GP — 2 leagues ──
  {
    raceId: "race-2025-07-ita",
    title: "Emilia Romagna Grand Prix",
    date: "2025-05-18",
    leagueCount: 2,
    isGraded: true,
    propPicks: [
      // correct
      { propType: "driverOfDay", answer: LEC, weight: 1, isCorrect: true, correctAnswers: [LEC] },
      // correct
      { propType: "fastestLap", answer: NOR, weight: 1, isCorrect: true, correctAnswers: [NOR] },
      // wrong
      { propType: "lapsLed", answer: VER, weight: 1, isCorrect: false, correctAnswers: [LEC] },
      // correct
      { propType: "fastestPitStop", answer: HAM, weight: 1, isCorrect: true, correctAnswers: [HAM] },
      // wrong
      { propType: "overAchiever", answer: SAI, weight: 1, isCorrect: false, correctAnswers: [RUS] },
      // correct
      { propType: "underAchiever", answer: STR, weight: 1, isCorrect: true, correctAnswers: [STR] },
      // correct
      { propType: "wrecker", answer: PER, weight: 1, isCorrect: true, correctAnswers: [PER] },
    ],
    // 5 correct / 7 total
    propWeightedAccuracy: 5 / 7,
  },

  // ── Race 8: Monaco GP — 2 leagues ──
  {
    raceId: "race-2025-08-mon",
    title: "Monaco Grand Prix",
    date: "2025-05-25",
    leagueCount: 2,
    isGraded: true,
    propPicks: [
      // correct
      { propType: "driverOfDay", answer: LEC, weight: 1, isCorrect: true, correctAnswers: [LEC] },
      // wrong
      { propType: "fastestLap", answer: VER, weight: 1, isCorrect: false, correctAnswers: [PIA] },
      // correct
      { propType: "lapsLed", answer: LEC, weight: 1, isCorrect: true, correctAnswers: [LEC] },
      // wrong
      { propType: "fastestPitStop", answer: NOR, weight: 1, isCorrect: false, correctAnswers: [HAM] },
      // correct
      { propType: "overAchiever", answer: ANT, weight: 1, isCorrect: true, correctAnswers: [ANT] },
      // wrong
      { propType: "underAchiever", answer: PER, weight: 1, isCorrect: false, correctAnswers: [ALO] },
      // wrong
      { propType: "wrecker", answer: STR, weight: 1, isCorrect: false, correctAnswers: [HUL] },
    ],
    // 3 correct / 7 total
    propWeightedAccuracy: 3 / 7,
  },

  // ── Race 9: Spanish GP — 2 leagues ──
  {
    raceId: "race-2025-09-esp",
    title: "Spanish Grand Prix",
    date: "2025-06-01",
    leagueCount: 2,
    isGraded: true,
    propPicks: [
      // correct
      { propType: "driverOfDay", answer: NOR, weight: 1, isCorrect: true, correctAnswers: [NOR] },
      // correct
      { propType: "fastestLap", answer: VER, weight: 1, isCorrect: true, correctAnswers: [VER] },
      // correct
      { propType: "lapsLed", answer: NOR, weight: 1, isCorrect: true, correctAnswers: [NOR] },
      // wrong
      { propType: "fastestPitStop", answer: LEC, weight: 1, isCorrect: false, correctAnswers: [PIA] },
      // correct
      { propType: "overAchiever", answer: RUS, weight: 1, isCorrect: true, correctAnswers: [RUS] },
      // correct
      { propType: "underAchiever", answer: STR, weight: 1, isCorrect: true, correctAnswers: [STR] },
      // wrong
      { propType: "wrecker", answer: ALO, weight: 1, isCorrect: false, correctAnswers: [PER] },
    ],
    // 5 correct / 7 total
    propWeightedAccuracy: 5 / 7,
  },

  // ── Race 10: Canadian GP — 2 leagues ──
  {
    raceId: "race-2025-10-can",
    title: "Canadian Grand Prix",
    date: "2025-06-15",
    leagueCount: 2,
    isGraded: true,
    propPicks: [
      // wrong
      { propType: "driverOfDay", answer: HAM, weight: 1, isCorrect: false, correctAnswers: [VER] },
      // correct
      { propType: "fastestLap", answer: NOR, weight: 1, isCorrect: true, correctAnswers: [NOR] },
      // correct
      { propType: "lapsLed", answer: VER, weight: 1, isCorrect: true, correctAnswers: [VER] },
      // correct
      { propType: "fastestPitStop", answer: NOR, weight: 1, isCorrect: true, correctAnswers: [NOR] },
      // wrong
      { propType: "overAchiever", answer: SAI, weight: 1, isCorrect: false, correctAnswers: [ANT] },
      // wrong
      { propType: "underAchiever", answer: STR, weight: 1, isCorrect: false, correctAnswers: [PER] },
      // correct
      { propType: "wrecker", answer: HUL, weight: 1, isCorrect: true, correctAnswers: [HUL] },
    ],
    // 4 correct / 7 total
    propWeightedAccuracy: 4 / 7,
  },

  // ── Race 11: Austrian GP — upcoming, ungraded ──
  {
    raceId: "race-2025-11-aut",
    title: "Austrian Grand Prix",
    date: "2025-06-29",
    leagueCount: 2,
    isGraded: false,
    propPicks: [
      { propType: "driverOfDay", answer: NOR, weight: 1, isCorrect: false, correctAnswers: [] },
      { propType: "fastestLap", answer: VER, weight: 1, isCorrect: false, correctAnswers: [] },
      { propType: "lapsLed", answer: NOR, weight: 1, isCorrect: false, correctAnswers: [] },
      { propType: "fastestPitStop", answer: PIA, weight: 1, isCorrect: false, correctAnswers: [] },
      { propType: "overAchiever", answer: ANT, weight: 1, isCorrect: false, correctAnswers: [] },
      { propType: "underAchiever", answer: STR, weight: 1, isCorrect: false, correctAnswers: [] },
      { propType: "wrecker", answer: HUL, weight: 1, isCorrect: false, correctAnswers: [] },
    ],
    propWeightedAccuracy: null,
  },
];

// ─── Derived aggregates ───────────────────────────────────────────────────────
// These are computed from PICK_FEED so the data stays consistent.

function computePropAccuracy(
  feed: RacePickEntryDTO[],
): PropAccuracyDTO[] {
  const totals: Partial<
    Record<PropName, { correct: number; total: number }>
  > = {};

  for (const race of feed) {
    if (!race.isGraded) continue;
    for (const pick of race.propPicks) {
      const entry = totals[pick.propType] ?? { correct: 0, total: 0 };
      entry.total += pick.weight;
      if (pick.isCorrect) entry.correct += pick.weight;
      totals[pick.propType] = entry;
    }
  }

  return (Object.entries(totals) as [PropName, { correct: number; total: number }][]).map(
    ([propType, { correct, total }]) => ({
      propType,
      correctWeight: correct,
      totalWeight: total,
      accuracy: total > 0 ? correct / total : 0,
    }),
  );
}

function computeTrendLine(feed: RacePickEntryDTO[]): TrendPointDTO[] {
  return feed
    .filter((r) => r.isGraded)
    .map((r) => ({
      raceId: r.raceId,
      date: r.date,
      title: r.title,
      propWeightedAccuracy: r.propWeightedAccuracy,
    }));
}

function computeOverallAccuracy(feed: RacePickEntryDTO[]): number {
  let correct = 0;
  let total = 0;
  for (const race of feed) {
    if (!race.isGraded) continue;
    for (const pick of race.propPicks) {
      total += pick.weight;
      if (pick.isCorrect) correct += pick.weight;
    }
  }
  return total > 0 ? correct / total : 0;
}

function computeTotalPropsAnswered(feed: RacePickEntryDTO[]): number {
  let count = 0;
  for (const race of feed) {
    if (!race.isGraded) continue;
    count += race.propPicks.length;
  }
  return count;
}

// ─── Mock implementation ──────────────────────────────────────────────────────

export class MockUserProfileStatsQuery implements IUserProfileStatsQuery {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_userId: string): Promise<UserProfileStatsResult> {
    const gradedRaces = PICK_FEED.filter((r) => r.isGraded).length;
    const overallAccuracy = computeOverallAccuracy(PICK_FEED);
    const totalPropsAnswered = computeTotalPropsAnswered(PICK_FEED);

    return Promise.resolve({
      player: {
        userId: "mock-user-hunter",
        name: "Hunter",
        avatarUrl: null,
      },
      summary: {
        overallPropAccuracy: overallAccuracy,
        totalRacesPredicted: gradedRaces,
        totalPropsAnswered,
      },
      propAccuracy: computePropAccuracy(PICK_FEED),
      trendLine: computeTrendLine(PICK_FEED),
      pickFeed: PICK_FEED,
      racersById: RACERS,
    });
  }
}
