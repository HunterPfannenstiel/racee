import type { League } from "@/server/domain/league";
import { dayAfter, dayBefore, type MotorsportCalendar, type MotorsportSeason } from "@/server/domain/motorsport-calendar";

/**
 * Keeps a league's season window in step with the admins' motorsport calendar.
 *
 * - A league linked to an admin season races exactly that season's dates (and
 *   follows it if the admins move the dates).
 * - A league waiting on its next season (started before the admins set it up)
 *   links to the first admin season after its last one as soon as it exists.
 * - A league that has never been linked links to the season it's racing now
 *   (`referenceDate`: its last scored race, else today). If there's no such
 *   season, it's fenced off before the first future season, so seasons the
 *   admins set up ahead of time never leak into it.
 *
 * `forNewLeague`: a brand-new league prefers the season in progress, else the
 * next one coming up.
 */
export function syncLeagueSeasonWindow(
  league: League,
  calendar: MotorsportCalendar,
  referenceDate: string,
  opts: { forNewLeague?: boolean } = {},
): void {
  const link = (s: MotorsportSeason) => league.setSeasonWindow(s.seasonId, s.startDate, s.endDate);

  const linked = league.motorsportSeasonId ? calendar.find(league.motorsportSeasonId) : null;
  if (linked) return link(linked);

  // Waiting on the next season: everything after the last one.
  const waitingAfter = league.seasonWindowStart
    ? dayBefore(league.seasonWindowStart)
    : league.seasonRacesAfter?.slice(0, 10) ?? null;
  if (waitingAfter) {
    const next = calendar.firstSeasonAfter(waitingAfter);
    if (next) return link(next);
    return league.setSeasonWindow(null, league.seasonWindowStart, null);
  }

  const ref = (league.seasonRacesThrough ?? referenceDate).slice(0, 10);
  const current = opts.forNewLeague
    ? (calendar.seasonOn(ref) ?? calendar.firstSeasonAfter(ref) ?? calendar.latestSeasonStartedBy(ref))
    : (calendar.seasonOn(ref) ?? calendar.latestSeasonStartedBy(ref));
  if (current) return link(current);

  const future = calendar.firstSeasonAfter(ref);
  league.setSeasonWindow(null, null, future ? dayBefore(future.startDate) : null);
}

/**
 * The window a league moves into when it starts its next season: the first
 * admin season after the one it just finished, or — if the admins haven't set
 * that up yet — "everything after the last season", to be linked later.
 */
export function nextSeasonWindow(
  league: League,
  calendar: MotorsportCalendar,
): { seasonId: string | null; start: string | null; end: string | null; label: string | null } {
  const lastDay = league.seasonWindowEnd ?? league.seasonRacesThrough;
  const after = (lastDay ?? new Date().toISOString()).slice(0, 10);
  const next = calendar.firstSeasonAfter(after);
  if (next) return { seasonId: next.seasonId, start: next.startDate, end: next.endDate, label: next.label };
  return { seasonId: null, start: league.seasonWindowEnd ? dayAfter(league.seasonWindowEnd) : null, end: null, label: null };
}

/** The motorsport's most recent scored race, else today — what "the season being raced now" means. */
export function calendarReferenceDate(races: readonly { date: string; keySetAt: string | null }[]): string {
  const scored = races.filter((r) => r.keySetAt !== null).map((r) => r.date.slice(0, 10)).sort();
  return scored[scored.length - 1] ?? new Date().toISOString().slice(0, 10);
}
