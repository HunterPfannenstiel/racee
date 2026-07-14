import type { ResultsRowData, StatsData } from "./types";

export const MOCK_CURRENT_USER_ID = "u-4";

export const MOCK_LEAGUE_NAME = "The Paddock Club";

export const MOCK_RACES = [
  { id: "race-1", title: "Monaco GP", date: "2026-05-24" },
  { id: "race-2", title: "Spanish GP", date: "2026-06-07" },
];

const PLAYER_COLOR: Record<string, string> = {
  "u-1": "#FF8000",
  "u-2": "#E8002D",
  "u-3": "#27F4D2",
  "u-4": "#3671C6",
  "u-5": "#229971",
  "u-6": "#FF87BC",
  "u-7": "#64C4FF",
  "u-8": "#F58020",
  "u-9": "#00594F",
  "u-10": "#2293D1",
  "u-11": "#6692FF",
  "u-12": "#B6BABD",
  "u-13": "#0090FF",
  "u-14": "#B6BABD",
  "u-15": "#37BEDD",
  "u-16": "#00594F",
  "u-17": "#52E252",
  "u-18": "#0090FF",
  "u-19": "#2293D1",
  "u-20": "#37BEDD",
  "u-21": "#B6BABD",
  "u-22": "#F58020",
  "u-23": "#52E252",
  "u-24": "#6692FF",
};

function row(userId: string, name: string, total: number, rank: number): ResultsRowData {
  return { userId, name, total, rank, color: PLAYER_COLOR[userId] };
}

// Only 3 scored entries: podium-only, no list panel.
const RACE_1_ENTRIES: ResultsRowData[] = [
  row("u-2", "Lando N.", 40, 1),
  row("u-1", "Max V.", 36, 2),
  row("u-4", "Hunter P.", 28, 3),
];

// Full 24-entry field: podium + a long list, current user lands in the list.
// Includes two tied ranks (4 and 10) to exercise the reveal's userId tiebreak.
const RACE_2_ENTRIES: ResultsRowData[] = [
  row("u-1", "Max V.", 45, 1),
  row("u-2", "Lando N.", 41, 2),
  row("u-3", "Charles L.", 37, 3),
  row("u-4", "Hunter P.", 33, 4),
  row("u-5", "Carlos S.", 33, 4),
  row("u-6", "George R.", 30, 6),
  row("u-7", "Lewis H.", 28, 7),
  row("u-8", "Oscar P.", 27, 8),
  row("u-9", "Fernando A.", 25, 9),
  row("u-10", "Sergio P.", 24, 10),
  row("u-11", "Yuki T.", 24, 10),
  row("u-12", "Pierre G.", 21, 12),
  row("u-13", "Esteban O.", 19, 13),
  row("u-14", "Nico H.", 18, 14),
  row("u-15", "Kevin M.", 17, 15),
  row("u-16", "Valtteri B.", 16, 16),
  row("u-17", "Zhou G.", 15, 17),
  row("u-18", "Alexander A.", 14, 18),
  row("u-19", "Lance S.", 13, 19),
  row("u-20", "Daniel R.", 11, 20),
  row("u-21", "Liam L.", 9, 21),
  row("u-22", "Franco C.", 7, 22),
  row("u-23", "Oliver B.", 5, 23),
  row("u-24", "Jack D.", 2, 24),
];

export const MOCK_RESULTS_BY_RACE: Record<string, ResultsRowData[]> = {
  "race-1": RACE_1_ENTRIES,
  "race-2": RACE_2_ENTRIES,
};

export const MOCK_STATS_BY_RACE: Record<string, StatsData> = {
  "race-1": {
    bestPropBet: { value: "92%", sublabel: "Safety Car Deployed" },
    averageScore: { value: "34.7" },
    highestScore: { value: "40", sublabel: "Lando N." },
    lowestScore: { value: "28", sublabel: "Hunter P." },
  },
  "race-2": {
    bestPropBet: { value: "86%", sublabel: "Fastest Lap" },
    averageScore: { value: "21.4" },
    highestScore: { value: "45", sublabel: "Max V." },
    lowestScore: { value: "2", sublabel: "Jack D." },
  },
};
