import type { AppNotification } from "@/server/domain/moderation";

/** The notification every member gets when their league's finale opens. */
export function finaleReadyNotification(leagueName: string, now: string): AppNotification {
  return {
    id: crypto.randomUUID(),
    kind: "season_finale",
    title: `${leagueName}: the season finale is ready`,
    body: "The final results are in. Open the standings to watch the finale and see who took home the trophies.",
    createdAt: now,
    read: false,
  };
}

/** Tells the league the commissioner worked on a player's season picks (never what they are). */
export function seasonPicksEditedNotification(leagueName: string, playerName: string, now: string): AppNotification {
  return {
    id: crypto.randomUUID(),
    kind: "season_picks_edited",
    title: `${leagueName}: season picks changed`,
    body: `Your commissioner worked on ${playerName}'s season picks.`,
    createdAt: now,
    read: false,
  };
}
