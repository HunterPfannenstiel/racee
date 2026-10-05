/**
 * Season ordering for standings columns and stages (mini-series).
 *
 * Stages split the season by race *slots*, not raw race count. A cancelled race
 * keeps its slot, and a replacement race doesn't add one — it sits right after
 * the race it replaces and counts toward that race's stage. So adding a
 * replacement never reshuffles which races belong to which stage.
 */

type OrderableRace = { date: string; replacesRaceId?: string | null };

/**
 * Date order, except each replacement is placed directly after the race it
 * replaces. A replacement whose target no longer exists is treated as a normal race.
 */
export function orderSeasonRaces<T extends OrderableRace>(races: readonly T[], idOf: (race: T) => string): T[] {
  const ids = new Set(races.map(idOf));
  const isReplacement = (r: T) => !!r.replacesRaceId && ids.has(r.replacesRaceId);
  const byDate = (a: T, b: T) => a.date.localeCompare(b.date);

  const slots = races.filter(r => !isReplacement(r)).sort(byDate);
  const ordered: T[] = [];
  for (const slot of slots) {
    ordered.push(slot);
    const slotId = idOf(slot);
    ordered.push(...races.filter(r => isReplacement(r) && r.replacesRaceId === slotId).sort(byDate));
  }
  return ordered;
}

/**
 * Splits the season into `stageCount` stages (0 = one stage holding everything),
 * returning race ids per stage in column order. Stage boundaries are computed
 * over slots only; replacements join the stage of the race they replace.
 */
export function computeSeasonStages<T extends OrderableRace>(
  races: readonly T[],
  idOf: (race: T) => string,
  stageCount: number,
): string[][] {
  const ordered = orderSeasonRaces(races, idOf);
  const ids = new Set(races.map(idOf));
  const isSlot = (r: T) => !(r.replacesRaceId && ids.has(r.replacesRaceId));
  const slotCount = ordered.filter(isSlot).length;

  if (stageCount <= 0) return [ordered.map(idOf)];

  const stages: string[][] = Array.from({ length: stageCount }, () => []);
  let slotIndex = -1;
  for (const race of ordered) {
    if (isSlot(race)) slotIndex++;
    const stageIdx = Math.floor((Math.max(slotIndex, 0) * stageCount) / slotCount);
    stages[stageIdx].push(idOf(race));
  }
  return stages;
}
