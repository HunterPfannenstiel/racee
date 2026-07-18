import { PROP_META } from "@/lib/props";
import type {
  ResultsEntryDTO,
  ResultsStatsDTO,
} from "@/server/queries/results/IResultsQuery";
import type { StatCell, StatsData } from "./types";

// Same convention used for missing values elsewhere in the app (e.g.
// app/players/[userId]/StatStrip.tsx, app/standings/RaceCell.tsx).
const NO_DATA = "—";

/** Joins tied userIds to display names, dropping any id that has no matching entry. */
function resolveNames(userIds: string[], entries: ResultsEntryDTO[]): string | undefined {
  const names = userIds
    .map((userId) => entries.find((e) => e.userId === userId)?.name)
    .filter((name): name is string => !!name);
  return names.length > 0 ? names.join(", ") : undefined;
}

function formatScoreCell(
  score: { value: number; userIds: string[] },
  entries: ResultsEntryDTO[],
): StatCell {
  return {
    value: String(Math.round(score.value)),
    sublabel: resolveNames(score.userIds, entries),
  };
}

function formatBestPropBet(bestPropBet: ResultsStatsDTO["bestPropBet"]): StatCell {
  if (!bestPropBet) {
    return { value: NO_DATA };
  }
  return {
    value: `${Math.round(bestPropBet.hitRate * 100)}%`,
    sublabel: PROP_META[bestPropBet.prop].label,
  };
}

/**
 * Pure presentation adapter: maps the domain's presentation-agnostic
 * ResultsStatsDTO onto the display-ready StatsData the
 * StatsFooter view expects. No fetching, no side effects.
 */
export function formatStats(
  stats: ResultsStatsDTO,
  entries: ResultsEntryDTO[],
): StatsData {
  return {
    bestPropBet: formatBestPropBet(stats.bestPropBet),
    averageScore: { value: stats.averageScore.toFixed(1) },
    highestScore: formatScoreCell(stats.highestScore, entries),
    lowestScore: formatScoreCell(stats.lowestScore, entries),
  };
}
