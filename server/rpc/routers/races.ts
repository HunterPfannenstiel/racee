import { z } from "zod";
import { authed, adminOnly } from "@/server/rpc/procedures";
import { RaceSchema, KeyMutationSchema } from "@/lib/schemas";
import { BlobRaceRepository } from "@/server/repositories/race/BlobRaceRepository";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/team/BlobTeamRepository";
import { BlobRacePredictionBookRepository } from "@/server/repositories/race-prediction-book/BlobRacePredictionBookRepository";
import { BlobLeagueStandingsRepository } from "@/server/repositories/league-standings/BlobLeagueStandingsRepository";
import { RacesQuery } from "@/server/queries/races/RacesQuery";
import { BlobCreateRaceCommand } from "@/server/commands/create-race/BlobCreateRaceCommand";
import { BlobUpdateRaceCommand } from "@/server/commands/update-race/BlobUpdateRaceCommand";
import { BlobDeleteRaceCommand } from "@/server/commands/delete-race/BlobDeleteRaceCommand";
import { BlobSetStartingGridCommand } from "@/server/commands/set-starting-grid/BlobSetStartingGridCommand";
import { SetRaceKeyCommand } from "@/server/commands/set-race-key/SetRaceKeyCommand";
import { RecalculateRaceCommand } from "@/server/commands/recalculate-race/RecalculateRaceCommand";

const raceRepo = new BlobRaceRepository();
const leagueRepo = new BlobLeagueRepository();
const teamRepo = new BlobTeamRepository();
const bookRepo = new BlobRacePredictionBookRepository();
const standingsRepo = new BlobLeagueStandingsRepository();

const racesQuery = new RacesQuery(raceRepo, leagueRepo);
const createRaceCommand = new BlobCreateRaceCommand(raceRepo);
const updateRaceCommand = new BlobUpdateRaceCommand(raceRepo);
const deleteRaceCommand = new BlobDeleteRaceCommand(raceRepo);
const setStartingGridCommand = new BlobSetStartingGridCommand(raceRepo);
const setRaceKeyCommand = new SetRaceKeyCommand(raceRepo, leagueRepo, bookRepo, standingsRepo, teamRepo);
const recalculateRaceCommand = new RecalculateRaceCommand(raceRepo, leagueRepo, bookRepo, standingsRepo, teamRepo);

const RacesListInput = z
  .object({
    motorsportId: z.string().uuid().optional(),
    leagueId: z.string().uuid().optional(),
  })
  .refine((v) => Boolean(v.motorsportId) !== Boolean(v.leagueId), {
    message: "Provide exactly one of motorsportId or leagueId.",
  });

const RaceKeyInput = z.object({ motorsportId: z.string().uuid(), raceId: z.string().uuid() });

// Mirrors what the legacy PATCH /api/races/[raceId] handler actually applied
// (the legacy race service's updateRace patch type) — see BlobUpdateRaceCommand
// for why this pick list is title/label/date/lockTime and not the full RaceSchema.
const RacePatchInput = RaceSchema.pick({
  title: true,
  label: true,
  date: true,
  lockTime: true,
}).partial();

export const racesRouter = {
  /**
   * Races for a motorsport, or for the motorsport a league races in. Ported
   * read-only from app/api/races/route.ts (GET). NOT admin-only — commissioner
   * pages (player-status, results) will consume this in later phases.
   */
  list: authed
    .input(RacesListInput)
    .output(z.array(RaceSchema))
    .handler(async ({ input }) => {
      return await racesQuery.execute(
        input.motorsportId ? { motorsportId: input.motorsportId } : { leagueId: input.leagueId! },
      );
    }),

  /**
   * Creates a race. Site-admin only — the legacy `POST /api/races` had no auth
   * at all; locking it down here is intended per the migration brief.
   */
  create: adminOnly
    .input(RaceSchema)
    .output(RaceSchema)
    .handler(async ({ input }) => {
      return await createRaceCommand.execute({
        raceId: input.id,
        motorsportId: input.motorsportId,
        title: input.title,
        label: input.label,
        date: input.date,
        lockTime: input.lockTime,
        startingGrid: input.startingGrid,
      });
    }),

  /** Updates a race's details. Site-admin only. */
  update: adminOnly
    .input(RaceKeyInput.extend({ patch: RacePatchInput }))
    .output(RaceSchema)
    .handler(async ({ input }) => {
      return await updateRaceCommand.execute({
        motorsportId: input.motorsportId,
        raceId: input.raceId,
        patch: input.patch,
      });
    }),

  /** Deletes a race. Site-admin only. */
  delete: adminOnly
    .input(RaceKeyInput)
    .output(z.object({ ok: z.literal(true) }))
    .handler(async ({ input }) => {
      await deleteRaceCommand.execute({ motorsportId: input.motorsportId, raceId: input.raceId });
      return { ok: true as const };
    }),

  /**
   * Sets a race's starting grid order. Site-admin only. Mirrors the legacy
   * grid PATCH's `{ ok: true }` response rather than the full race — matches
   * app/admin/races/RacesSection.tsx's grid editor, which only needs to know
   * the save succeeded.
   */
  setGrid: adminOnly
    .input(RaceKeyInput.extend({ startingGrid: z.array(z.string().uuid()) }))
    .output(z.object({ ok: z.literal(true) }))
    .handler(async ({ input }) => {
      await setStartingGridCommand.execute({
        motorsportId: input.motorsportId,
        raceId: input.raceId,
        startingGrid: input.startingGrid,
      });
      return { ok: true as const };
    }),

  /**
   * Sets a race's answer key (finish order + prop results) and regrades
   * every league racing that motorsport. Site-admin only — the legacy
   * `PUT /api/races/key` had no auth at all; locking it down here is
   * intended per the migration brief. Mirrors that route's `{ ok: true }`
   * response.
   */
  setKey: adminOnly
    .input(KeyMutationSchema)
    .output(z.object({ ok: z.literal(true) }))
    .handler(async ({ input }) => {
      await setRaceKeyCommand.execute({
        motorsportId: input.motorsportId,
        raceId: input.raceId,
        racerIds: input.racerIds,
        propKey: input.propKey,
      });
      return { ok: true as const };
    }),

  /**
   * Re-runs grading for a race already carrying an answer key. Site-admin
   * only — the legacy `POST /api/races/[raceId]/recalculate` had no auth at
   * all. That route derived `raceId` from the URL and took `motorsportId` in
   * the body; both are required here as ordinary input fields. Mirrors the
   * legacy `{ ok: true }` response.
   */
  recalculate: adminOnly
    .input(RaceKeyInput)
    .output(z.object({ ok: z.literal(true) }))
    .handler(async ({ input }) => {
      await recalculateRaceCommand.execute({
        motorsportId: input.motorsportId,
        raceId: input.raceId,
      });
      return { ok: true as const };
    }),
};
