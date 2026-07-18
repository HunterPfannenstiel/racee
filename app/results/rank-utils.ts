/**
 * Groups entries by their `rank` field. Ranks can be shared (a tie), in
 * which case every entry in the group must be rendered -- not just one.
 *
 * Historical bug (fixed by extracting this): Podium.tsx and
 * PodiumStage.tsx each independently built a rank -> single-entry lookup
 * (Object.fromEntries / a plain object assigned in a loop). When two
 * entries shared a rank, the second one silently overwrote the first in
 * that lookup, so one of the tied entries vanished from the page entirely,
 * and if the tie was for 2nd, no entry ever had rank 3, leaving the 3rd
 * podium slot looking broken instead of correctly empty.
 */
export function groupEntriesByRank<T extends { rank: number }>(entries: T[]): Map<number, T[]> {
  const byRank = new Map<number, T[]>();
  for (const entry of entries) {
    const group = byRank.get(entry.rank);
    if (group) group.push(entry);
    else byRank.set(entry.rank, [entry]);
  }
  return byRank;
}
