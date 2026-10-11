import type { League } from "@/server/domain/league";
import type { Team } from "@/server/domain/team";
import { DEFAULT_RING_COLOR, PLAYER_COLOR_PALETTE } from "@/lib/avatar";

const norm = (c: string) => c.trim().toLowerCase();

/**
 * Every visible player's own ring color in `league`. Stored colors are kept as-is;
 * anyone without one gets the first palette color not already used by a stored
 * player color, a team, or an earlier pick (in member order, so it's stable).
 */
export function resolvePlayerColors(league: League, teams: readonly Team[]): Record<string, string> {
  const stored = league.playerColors;
  const userIds = league.visibleUserIds;
  const result: Record<string, string> = {};
  const taken = new Set<string>([
    ...teams.map((t) => t.color).filter((c): c is string => !!c).map(norm),
    ...Object.values(stored).map(norm),
  ]);
  for (const id of userIds) {
    if (stored[id]) result[id] = stored[id];
  }
  let overflow = 0;
  for (const id of userIds) {
    if (result[id]) continue;
    const free = PLAYER_COLOR_PALETTE.find((c) => !taken.has(norm(c)));
    // More players than palette colors: reuse the palette in order.
    const pick = free ?? PLAYER_COLOR_PALETTE[overflow++ % PLAYER_COLOR_PALETTE.length];
    taken.add(norm(pick));
    result[id] = pick;
  }
  return result;
}

/**
 * The ring color shown for each player in `league`: their team's color when
 * they're on a team, otherwise their own player color.
 */
export function resolveRingColors(league: League, teams: readonly Team[]): Record<string, string> {
  const own = resolvePlayerColors(league, teams);
  const result: Record<string, string> = { ...own };
  for (const team of teams) {
    for (const userId of team.memberIds) {
      if (userId in result) result[userId] = team.color ?? DEFAULT_RING_COLOR;
    }
  }
  return result;
}
