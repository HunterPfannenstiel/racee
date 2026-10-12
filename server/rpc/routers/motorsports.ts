import { z } from "zod";
import { authed, adminOnly } from "@/server/rpc/procedures";
import { MotorsportSchema } from "@/lib/schemas";
import { BlobMotorsportRepository } from "@/server/repositories/motorsport/BlobMotorsportRepository";
import { BlobMotorsportsQuery } from "@/server/queries/motorsports/BlobMotorsportsQuery";
import { BlobMotorsportCalendarRepository } from "@/server/repositories/motorsport-calendar/BlobMotorsportCalendarRepository";
import { BlobRaceRepository } from "@/server/repositories/race/BlobRaceRepository";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import { MotorsportCalendarQuery } from "@/server/queries/motorsport-calendar/MotorsportCalendarQuery";
import { SaveMotorsportSeasonCommand } from "@/server/commands/save-motorsport-season/SaveMotorsportSeasonCommand";
import { DeleteMotorsportSeasonCommand } from "@/server/commands/delete-motorsport-season/DeleteMotorsportSeasonCommand";

const motorsportRepo = new BlobMotorsportRepository();

const motorsportsQuery = new BlobMotorsportsQuery(motorsportRepo);
const calendarRepo = new BlobMotorsportCalendarRepository();
const raceRepo = new BlobRaceRepository();
const leagueRepo = new BlobLeagueRepository();
const calendarQuery = new MotorsportCalendarQuery(calendarRepo, raceRepo, leagueRepo);
const saveSeasonCommand = new SaveMotorsportSeasonCommand(calendarRepo, raceRepo, leagueRepo);
const deleteSeasonCommand = new DeleteMotorsportSeasonCommand(calendarRepo, raceRepo, leagueRepo);

const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const SeasonDTOSchema = z.object({
  seasonId: z.string(),
  label: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  raceCount: z.number(),
  leagueCount: z.number(),
});

export const motorsportsRouter = {
  /** All motorsports. Ported read-only from app/api/motorsports/route.ts. */
  list: authed
    .output(z.array(MotorsportSchema))
    .handler(async () => motorsportsQuery.execute()),

  /** A motorsport's seasons (start and end dates). Site-admin only. */
  seasons: adminOnly
    .input(z.object({ motorsportId: z.string().uuid() }))
    .output(z.object({
      motorsportId: z.string(),
      seasons: z.array(SeasonDTOSchema),
      racesOutsideSeasons: z.number(),
      leaguesWaiting: z.number(),
    }))
    .handler(async ({ input }) => calendarQuery.execute(input.motorsportId)),

  /** Adds (no seasonId) or edits a season. Site-admin only. */
  saveSeason: adminOnly
    .input(z.object({
      motorsportId: z.string().uuid(),
      seasonId: z.string().uuid().optional(),
      label: z.string().trim().min(1).max(40),
      startDate: Day,
      endDate: Day,
    }))
    .output(z.object({ ok: z.literal(true) }))
    .handler(async ({ input }) => {
      await saveSeasonCommand.execute(input);
      return { ok: true as const };
    }),

  /** Deletes a season no league is racing. Site-admin only. */
  deleteSeason: adminOnly
    .input(z.object({ motorsportId: z.string().uuid(), seasonId: z.string().uuid() }))
    .output(z.object({ ok: z.literal(true) }))
    .handler(async ({ input }) => {
      await deleteSeasonCommand.execute(input);
      return { ok: true as const };
    }),
};
