import { PROP_META } from "@/lib/props";
import type { PropName } from "@/lib/schemas";
import type { PvpEntry, PvpRacer } from "./hooks/usePlayerVsPlayerRaceData";
import type { PvpPlayer, PropPickRow, GridPredictionRow } from "./types";

const PROP_LIST = Object.keys(PROP_META) as PropName[];

// Workshop-specified row labels (slightly different phrasing than lib/props.ts's
// PROP_META, which drives the picker UI rather than this results display) --
// kept identical to the mock's copy for continuity.
const PROP_LABELS: Record<PropName, string> = {
  driverOfDay: "Driver of the Day",
  lapsLed: "Most Laps Led",
  fastestPitStop: "Fastest Pit Stop",
  fastestLap: "Fastest Lap",
  overAchiever: "Over-Achiever",
  underAchiever: "Under-Achiever",
  wrecker: "Wrecker",
};

export function toPvpPlayer(entry: PvpEntry, isCurrentUser: boolean): PvpPlayer {
  return {
    userId: entry.userId,
    name: entry.name,
    color: entry.color,
    isCurrentUser,
    rank: entry.rank ?? 0,
    points: entry.total ?? 0,
    pointsBack: entry.pointsBack ?? 0,
    propsPoints: entry.propPoints ?? 0,
    gridPoints: entry.gridPoints ?? 0,
  };
}

// Driver-type prop picks store a racerId; constructor-type picks (fastestPitStop)
// store the team name directly since there's no separate constructor id --
// resolve both through racersById so no second color table is needed.
function resolvePickDisplay(
  propName: PropName,
  value: string | undefined,
  racersById: Record<string, PvpRacer>,
): { label: string; color?: string } {
  if (!value) return { label: "—", color: undefined };
  if (PROP_META[propName].type === "constructor") {
    const racer = Object.values(racersById).find((r) => r.team === value);
    return { label: value, color: racer?.teamColor };
  }
  const racer = racersById[value];
  return { label: racer?.name ?? "Unknown", color: racer?.teamColor };
}

export function buildPropPickRows(
  left: PvpEntry,
  right: PvpEntry,
  racersById: Record<string, PvpRacer>,
): PropPickRow[] {
  const leftByProp = new Map((left.propBreakdown ?? []).map((b) => [b.propName, b]));
  const rightByProp = new Map((right.propBreakdown ?? []).map((b) => [b.propName, b]));

  return PROP_LIST.map((prop) => {
    const leftBreak = leftByProp.get(prop);
    const rightBreak = rightByProp.get(prop);
    const leftDisplay = resolvePickDisplay(prop, leftBreak?.pickedValue, racersById);
    const rightDisplay = resolvePickDisplay(prop, rightBreak?.pickedValue, racersById);
    const winners = leftBreak?.winners ?? rightBreak?.winners ?? null;

    return {
      prop,
      label: PROP_LABELS[prop],
      actual: winners?.join(" / ") ?? "—",
      leftPick: leftDisplay.label,
      leftPickColor: leftDisplay.color,
      leftPoints: leftBreak?.points ?? 0,
      rightPick: rightDisplay.label,
      rightPickColor: rightDisplay.color,
      rightPoints: rightBreak?.points ?? 0,
    };
  });
}

// keyOrder indexes by actual finishing position; each side's own predicted
// order (gridPrediction) tells us which racer occupied that predicted slot,
// and gridBreakdown (keyed by racerId) supplies that racer's earned points.
export function buildGridPredictionRows(
  left: PvpEntry,
  right: PvpEntry,
  keyOrder: string[],
  racersById: Record<string, PvpRacer>,
): GridPredictionRow[] {
  const leftByRacer = new Map((left.gridBreakdown ?? []).map((b) => [b.racerId, b]));
  const rightByRacer = new Map((right.gridBreakdown ?? []).map((b) => [b.racerId, b]));
  const leftOrder = left.gridPrediction ?? [];
  const rightOrder = right.gridPrediction ?? [];

  return keyOrder.map((actualRacerId, i) => {
    const leftRacerId = leftOrder[i];
    const rightRacerId = rightOrder[i];
    return {
      position: i + 1,
      actualRacerName: racersById[actualRacerId]?.name ?? "Unknown",
      leftRacerName: leftRacerId ? (racersById[leftRacerId]?.name ?? "Unknown") : "—",
      leftRacerColor: leftRacerId ? racersById[leftRacerId]?.teamColor : undefined,
      leftPoints: leftRacerId ? (leftByRacer.get(leftRacerId)?.points ?? 0) : 0,
      rightRacerName: rightRacerId ? (racersById[rightRacerId]?.name ?? "Unknown") : "—",
      rightRacerColor: rightRacerId ? racersById[rightRacerId]?.teamColor : undefined,
      rightPoints: rightRacerId ? (rightByRacer.get(rightRacerId)?.points ?? 0) : 0,
    };
  });
}
