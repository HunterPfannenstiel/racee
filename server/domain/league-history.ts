import { z } from "zod";
import { InvariantViolationError } from "./errors";

/**
 * A league's history book: one frozen record per finished season. The season in
 * progress is never stored here — it's built live from the standings until the
 * commissioner starts the next season, so score fixes keep moving its trophies.
 */

const MedalSchema = z.enum(["gold", "silver", "bronze"]);

export const MedalCountsSchema = z.object({
  gold: z.number().int().min(0).default(0),
  silver: z.number().int().min(0).default(0),
  bronze: z.number().int().min(0).default(0),
});

export const MedalDetailSchema = z.object({
  raceId: z.string(),
  raceLabel: z.string(),
  date: z.string(),
  medal: MedalSchema,
  points: z.number(),
});
export type MedalDetail = z.infer<typeof MedalDetailSchema>;

export const SeasonPlayerRecordSchema = z.object({
  /** Null on imported rows that couldn't be matched to an account. */
  userId: z.string().nullable(),
  name: z.string().min(1),
  /** Final place (ties share). Null when unknown (imported without a place). */
  rank: z.number().int().min(1).nullable(),
  /** Final total, mulligans applied. */
  total: z.number(),
  /** Every race counted, no mulligans. */
  gross: z.number(),
  racesScored: z.number().int().min(0).default(0),
  highScore: z.number().nullable().default(null),
  medals: MedalCountsSchema,
  raceWins: z.number().int().min(0).default(0),
  medalDetails: z.array(MedalDetailSchema).default([]),
  /** Per-race points, keyed by race column id (empty for imported seasons). */
  raceScores: z.record(z.string(), z.number()).default({}),
  mulliganedRaceIds: z.array(z.string()).default([]),
});
export type SeasonPlayerRecord = z.infer<typeof SeasonPlayerRecordSchema>;

export const SeasonTeamRecordSchema = z.object({
  /** The team's id — a kept ("franchise") team keeps it across seasons. */
  teamId: z.string().nullable(),
  name: z.string().min(1),
  color: z.string().nullable().default(null),
  rank: z.number().int().min(1).nullable(),
  total: z.number(),
  racesScored: z.number().int().min(0).default(0),
  highScore: z.number().nullable().default(null),
  medals: MedalCountsSchema,
  raceWins: z.number().int().min(0).default(0),
  medalDetails: z.array(MedalDetailSchema).default([]),
  raceScores: z.record(z.string(), z.number()).default({}),
  /** Who drove for the team that season. */
  memberUserIds: z.array(z.string()).default([]),
  memberNames: z.array(z.string()).default([]),
});
export type SeasonTeamRecord = z.infer<typeof SeasonTeamRecordSchema>;

export const SeasonRaceColumnSchema = z.object({
  raceId: z.string(),
  label: z.string(),
  date: z.string(),
  cancelled: z.boolean().default(false),
  replacesLabel: z.string().nullable().default(null),
});
export type SeasonRaceColumn = z.infer<typeof SeasonRaceColumnSchema>;

export const SeasonRecordSchema = z.object({
  seasonId: z.string().uuid(),
  label: z.string().min(1),
  endedAt: z.string(),
  /** Entered by an admin from records kept outside Racee. */
  imported: z.boolean().default(false),
  mulliganCount: z.number().int().min(0).default(0),
  races: z.array(SeasonRaceColumnSchema).default([]),
  players: z.array(SeasonPlayerRecordSchema),
  teams: z.array(SeasonTeamRecordSchema).default([]),
});
export type SeasonRecord = z.infer<typeof SeasonRecordSchema>;
export type SeasonRecordInput = z.input<typeof SeasonRecordSchema>;

export class LeagueHistory {
  private _seasons: SeasonRecord[];

  static empty(leagueId: string): LeagueHistory {
    return new LeagueHistory(leagueId, []);
  }

  constructor(readonly leagueId: string, seasons: SeasonRecordInput[]) {
    this._seasons = seasons.map(s => SeasonRecordSchema.parse(s));
  }

  /** Oldest first. */
  get seasons(): readonly SeasonRecord[] {
    return [...this._seasons].sort((a, b) => a.endedAt.localeCompare(b.endedAt));
  }

  addSeason(season: SeasonRecordInput): void {
    const parsed = SeasonRecordSchema.parse(season);
    if (this._seasons.some(s => s.seasonId === parsed.seasonId)) {
      throw new InvariantViolationError("That season is already in the history book");
    }
    this._seasons.push(parsed);
  }

  removeSeason(seasonId: string): void {
    const before = this._seasons.length;
    this._seasons = this._seasons.filter(s => s.seasonId !== seasonId);
    if (this._seasons.length === before) throw new InvariantViolationError("That season isn't in the history book");
  }

  /** Erases a player from every season (their rows and their name on team rosters). Team totals stay. */
  removeUser(userId: string): void {
    this._seasons = this._seasons.map(s => ({
      ...s,
      players: s.players.filter(p => p.userId !== userId),
      teams: s.teams.map(t => {
        const idx = t.memberUserIds.indexOf(userId);
        if (idx === -1) return t;
        return {
          ...t,
          memberUserIds: t.memberUserIds.filter((_, i) => i !== idx),
          memberNames: t.memberNames.filter((_, i) => i !== idx),
        };
      }),
    }));
  }
}
