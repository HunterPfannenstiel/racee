import type { ResultsRowData, StatsData } from "./types";

export const MOCK_CURRENT_USER_ID = "u-4";

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

// Full field: podium + list, current user lands in the list.
const RACE_2_ENTRIES: ResultsRowData[] = [
  row("u-1", "Max V.", 43, 1),
  row("u-2", "Lando N.", 38, 2),
  row("u-3", "Charles L.", 31, 3),
  row("u-4", "Hunter P.", 22, 4),
  row("u-5", "Carlos S.", 19, 5),
  row("u-6", "George R.", 15, 6),
  row("u-7", "Lewis H.", 9, 7),
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
    averageScore: { value: "25.3" },
    highestScore: { value: "43", sublabel: "Max V." },
    lowestScore: { value: "9", sublabel: "Lewis H." },
  },
};
