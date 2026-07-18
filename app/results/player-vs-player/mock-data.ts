import type { PropName } from "@/lib/schemas";
import type { PvpPlayer, PropPickRow, GridPredictionRow, JumpablePlayer } from "./types";

export const MOCK_CURRENT_USER_ID = "u-4";
export const MOCK_RACE_TITLE = "Spanish GP";

// League config value (see server/domain/league.ts's scoringDepth) -- Grid
// Prediction rows past this finishing position never score.
export const MOCK_SCORING_DEPTH = 17;

// Same league roster/colors as app/results/mock-data.ts (PLAYER_COLOR + names) --
// kept identical here so a player's identity stripe is consistent across screens.
const SUBMITTED_BASE = [
  { userId: "u-1", name: "Max V.", color: "#FF8000" },
  { userId: "u-2", name: "Lando N.", color: "#E8002D" },
  { userId: "u-3", name: "Charles L.", color: "#27F4D2" },
  { userId: "u-4", name: "Hunter P.", color: "#3671C6" },
  { userId: "u-5", name: "Carlos S.", color: "#229971" },
  { userId: "u-6", name: "George R.", color: "#FF87BC" },
  { userId: "u-7", name: "Lewis H.", color: "#64C4FF" },
  { userId: "u-8", name: "Oscar P.", color: "#F58020" },
  { userId: "u-9", name: "Fernando A.", color: "#00594F" },
  { userId: "u-10", name: "Sergio P.", color: "#2293D1" },
  { userId: "u-11", name: "Yuki T.", color: "#6692FF" },
  { userId: "u-12", name: "Pierre G.", color: "#B6BABD" },
] as const;

// League players who didn't submit picks for this race -- appear only in the
// player-jump drawer, sorted to the bottom, disabled.
const NON_SUBMITTED_BASE = [
  { userId: "u-13", name: "Esteban O.", color: "#0090FF" },
  { userId: "u-14", name: "Nico H.", color: "#B6BABD" },
  { userId: "u-15", name: "Kevin M.", color: "#37BEDD" },
] as const;

const PROP_LIST: PropName[] = [
  "driverOfDay",
  "lapsLed",
  "fastestPitStop",
  "fastestLap",
  "overAchiever",
  "underAchiever",
  "wrecker",
];

// Workshop-specified row labels (slightly different phrasing than lib/props.ts'
// PROP_META, which drives the picker UI rather than the results display).
const PROP_LABELS: Record<PropName, string> = {
  driverOfDay: "Driver of the Day",
  lapsLed: "Most Laps Led",
  fastestPitStop: "Fastest Pit Stop",
  fastestLap: "Fastest Lap",
  overAchiever: "Over-Achiever",
  underAchiever: "Under-Achiever",
  wrecker: "Wrecker",
};

// Answer key reused from seed-2026.mjs's Australian GP props for continuity
// with the rest of the app's mock world.
const ACTUAL_PROP_ANSWERS: Record<PropName, string> = {
  driverOfDay: "Oliver Bearman",
  lapsLed: "George Russell",
  fastestPitStop: "Mercedes",
  fastestLap: "Lando Norris",
  overAchiever: "Oliver Bearman",
  underAchiever: "Fernando Alonso",
  wrecker: "Isack Hadjar",
};

const WRONG_PROP_PICKS: Record<PropName, string> = {
  driverOfDay: "Lando Norris",
  lapsLed: "Max Verstappen",
  fastestPitStop: "Red Bull Racing",
  fastestLap: "Charles Leclerc",
  overAchiever: "Esteban Ocon",
  underAchiever: "Lance Stroll",
  wrecker: "Franco Colapinto",
};

const PROP_POINT_VALUE = 5;

// Team colors + driver/team roster reused verbatim from seed-2026.mjs, for the
// same continuity reason as ACTUAL_FINISH_ORDER below -- this is the app's
// existing driver/constructor color identity (Racer.teamColor), not a new
// palette invented for this drawer.
const TEAM_COLORS: Record<string, string> = {
  "Red Bull Racing": "#1E5BC6",
  Mercedes: "#00D2BE",
  Ferrari: "#DC0000",
  McLaren: "#FF8000",
  "Aston Martin": "#006F62",
  Williams: "#005AFF",
  Alpine: "#0090FF",
  Audi: "#C00000",
  Haas: "#ABABAB",
  "Racing Bulls": "#2647D8",
  Cadillac: "#333333",
};

const DRIVER_TEAM: Record<string, string> = {
  "Max Verstappen": "Red Bull Racing",
  "Isack Hadjar": "Red Bull Racing",
  "George Russell": "Mercedes",
  "Kimi Antonelli": "Mercedes",
  "Charles Leclerc": "Ferrari",
  "Lewis Hamilton": "Ferrari",
  "Lando Norris": "McLaren",
  "Oscar Piastri": "McLaren",
  "Fernando Alonso": "Aston Martin",
  "Lance Stroll": "Aston Martin",
  "Alex Albon": "Williams",
  "Carlos Sainz Jr.": "Williams",
  "Pierre Gasly": "Alpine",
  "Franco Colapinto": "Alpine",
  "Gabriel Bortoleto": "Audi",
  "Nico Hulkenberg": "Audi",
  "Esteban Ocon": "Haas",
  "Oliver Bearman": "Haas",
  "Liam Lawson": "Racing Bulls",
  "Arvid Lindblad": "Racing Bulls",
  "Sergio Perez": "Cadillac",
  "Valtteri Bottas": "Cadillac",
};

// Resolves a prop/grid pick's color regardless of whether it's a driver name
// (colored by their team) or a constructor name (fastestPitStop picks teams
// directly).
function getPickColor(name: string): string | undefined {
  return TEAM_COLORS[name] ?? (DRIVER_TEAM[name] ? TEAM_COLORS[DRIVER_TEAM[name]] : undefined);
}

// 22-driver actual finishing order, reused verbatim from seed-2026.mjs's
// Australian GP result for continuity with the rest of the app's mock world.
const ACTUAL_FINISH_ORDER = [
  "George Russell",
  "Kimi Antonelli",
  "Charles Leclerc",
  "Lewis Hamilton",
  "Lando Norris",
  "Max Verstappen",
  "Oliver Bearman",
  "Arvid Lindblad",
  "Gabriel Bortoleto",
  "Pierre Gasly",
  "Esteban Ocon",
  "Alex Albon",
  "Liam Lawson",
  "Franco Colapinto",
  "Carlos Sainz Jr.",
  "Sergio Perez",
  "Lance Stroll",
  "Fernando Alonso",
  "Valtteri Bottas",
  "Isack Hadjar",
  "Oscar Piastri",
  "Nico Hulkenberg",
];

// Matches lib/scoring.ts's placementPoints scale: exact slot = 10, 1-off = 7,
// 2-off = 3, anything further = 0.
const PLACEMENT_POINTS = [10, 7, 3];

function pointsForDisplacement(diff: number): number {
  return PLACEMENT_POINTS[diff] ?? 0;
}

// Deterministic "near miss" shuffle: adjacent swaps spread across the order,
// so most drivers land within 0-2 slots of their actual finish (matching how
// a plausible predicted grid would score) without hand-authoring 12 orders.
function buildPredictedOrder(swapCount: number): string[] {
  const order = [...ACTUAL_FINISH_ORDER];
  for (let i = 0; i < swapCount; i++) {
    const pos = (i * 3) % (order.length - 1);
    [order[pos], order[pos + 1]] = [order[pos + 1], order[pos]];
  }
  return order;
}

function buildPropPicks(userIndex: number, correctCount: number) {
  const picks = {} as Record<PropName, { pick: string; points: number }>;
  PROP_LIST.forEach((prop, i) => {
    const isCorrect = (i + userIndex) % PROP_LIST.length < correctCount;
    picks[prop] = isCorrect
      ? { pick: ACTUAL_PROP_ANSWERS[prop], points: PROP_POINT_VALUE }
      : { pick: WRONG_PROP_PICKS[prop], points: 0 };
  });
  return picks;
}

// Roughly descending "skill" by roster order -- lower index = more correct
// props + fewer grid swaps, so ranks below land out in roster order too.
const CORRECT_PROP_COUNTS = [6, 5, 5, 4, 4, 3, 4, 3, 3, 2, 3, 2];
const SWAP_COUNTS = [0, 1, 1, 2, 3, 4, 3, 5, 6, 8, 7, 9];

type UserPickData = {
  propPicks: Record<PropName, { pick: string; points: number }>;
  predictedOrder: string[];
  gridPointsByRacer: Record<string, number>;
  propsPoints: number;
  gridPoints: number;
};

const PICK_DATA_BY_USER: Record<string, UserPickData> = {};

SUBMITTED_BASE.forEach((player, index) => {
  const propPicks = buildPropPicks(index, CORRECT_PROP_COUNTS[index]);
  const predictedOrder = buildPredictedOrder(SWAP_COUNTS[index]);
  const gridPointsByRacer: Record<string, number> = {};
  predictedOrder.forEach((racerName, predictedPosition) => {
    const actualPosition = ACTUAL_FINISH_ORDER.indexOf(racerName);
    gridPointsByRacer[racerName] = pointsForDisplacement(Math.abs(predictedPosition - actualPosition));
  });

  const propsPoints = PROP_LIST.reduce((sum, prop) => sum + propPicks[prop].points, 0);
  const gridPoints = Object.values(gridPointsByRacer).reduce((sum, pts) => sum + pts, 0);

  PICK_DATA_BY_USER[player.userId] = { propPicks, predictedOrder, gridPointsByRacer, propsPoints, gridPoints };
});

const totalsByUserId: Record<string, number> = {};
SUBMITTED_BASE.forEach((player) => {
  const data = PICK_DATA_BY_USER[player.userId];
  totalsByUserId[player.userId] = data.propsPoints + data.gridPoints;
});

const leaderTotal = Math.max(...Object.values(totalsByUserId));

const rankedUserIds = [...SUBMITTED_BASE]
  .map((p) => p.userId)
  .sort((a, b) => totalsByUserId[b] - totalsByUserId[a]);

const rankByUserId: Record<string, number> = {};
rankedUserIds.forEach((userId, i) => {
  rankByUserId[userId] = i + 1;
});

export const MOCK_ROSTER: PvpPlayer[] = SUBMITTED_BASE.map((player) => ({
  userId: player.userId,
  name: player.name,
  color: player.color,
  isCurrentUser: player.userId === MOCK_CURRENT_USER_ID,
  rank: rankByUserId[player.userId],
  points: totalsByUserId[player.userId],
  pointsBack: leaderTotal - totalsByUserId[player.userId],
  propsPoints: PICK_DATA_BY_USER[player.userId].propsPoints,
  gridPoints: PICK_DATA_BY_USER[player.userId].gridPoints,
})).sort((a, b) => a.rank - b.rank);

export const MOCK_JUMPABLE_PLAYERS: JumpablePlayer[] = [
  ...MOCK_ROSTER.map((p) => ({ userId: p.userId, name: p.name, color: p.color, rank: p.rank, hasSubmitted: true })),
  ...NON_SUBMITTED_BASE.map((p) => ({ userId: p.userId, name: p.name, color: p.color, rank: null, hasSubmitted: false })),
];

export function getPropPickRows(leftUserId: string, rightUserId: string): PropPickRow[] {
  const leftData = PICK_DATA_BY_USER[leftUserId];
  const rightData = PICK_DATA_BY_USER[rightUserId];
  return PROP_LIST.map((prop) => ({
    prop,
    label: PROP_LABELS[prop],
    actual: ACTUAL_PROP_ANSWERS[prop],
    leftPick: leftData.propPicks[prop].pick,
    leftPickColor: getPickColor(leftData.propPicks[prop].pick),
    leftPoints: leftData.propPicks[prop].points,
    rightPick: rightData.propPicks[prop].pick,
    rightPickColor: getPickColor(rightData.propPicks[prop].pick),
    rightPoints: rightData.propPicks[prop].points,
  }));
}

export function getGridPredictionRows(leftUserId: string, rightUserId: string): GridPredictionRow[] {
  const leftData = PICK_DATA_BY_USER[leftUserId];
  const rightData = PICK_DATA_BY_USER[rightUserId];
  return leftData.predictedOrder.map((leftRacerName, i) => {
    const rightRacerName = rightData.predictedOrder[i];
    const actualRacerName = ACTUAL_FINISH_ORDER[i];
    return {
      position: i + 1,
      actualRacerName,
      leftRacerName,
      leftRacerColor: getPickColor(leftRacerName),
      leftPoints: leftData.gridPointsByRacer[leftRacerName],
      rightRacerName,
      rightRacerColor: getPickColor(rightRacerName),
      rightPoints: rightData.gridPointsByRacer[rightRacerName],
    };
  });
}

export function buildComparison(leftUserId: string, rightUserId: string) {
  const left = MOCK_ROSTER.find((p) => p.userId === leftUserId);
  const right = MOCK_ROSTER.find((p) => p.userId === rightUserId);
  if (!left || !right) return null;

  const propRows = getPropPickRows(leftUserId, rightUserId);
  const gridRows = getGridPredictionRows(leftUserId, rightUserId);

  return {
    raceTitle: MOCK_RACE_TITLE,
    left,
    right,
    scoringDepth: MOCK_SCORING_DEPTH,
  };
}
