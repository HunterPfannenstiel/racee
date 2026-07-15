import { z } from "zod";
import { authed, adminOnly } from "@/server/rpc/procedures";
import { RacerSchema } from "@/lib/schemas";
import { BlobRacerRepository } from "@/server/repositories/racer/BlobRacerRepository";
import { BlobRacersQuery } from "@/server/queries/racers/BlobRacersQuery";
import { BlobCreateRacerCommand } from "@/server/commands/create-racer/BlobCreateRacerCommand";
import { BlobUpdateRacerCommand } from "@/server/commands/update-racer/BlobUpdateRacerCommand";
import { BlobDeleteRacerCommand } from "@/server/commands/delete-racer/BlobDeleteRacerCommand";

const racerRepo = new BlobRacerRepository();

const racersQuery = new BlobRacersQuery(racerRepo);
const createRacerCommand = new BlobCreateRacerCommand(racerRepo);
const updateRacerCommand = new BlobUpdateRacerCommand(racerRepo);
const deleteRacerCommand = new BlobDeleteRacerCommand(racerRepo);

const RacerIdInput = z.object({ racerId: z.string().uuid() });

// Mirrors what app/admin/drivers/DriversSection.tsx's PATCH request actually sent
// (name/team/image/teamColor) — the legacy route parsed with a *full*
// `RacerSchema.omit({ id: true })`, which technically also required motorsportId, but
// nothing in the app ever sent it on edit. This partial patch reflects the real
// (working) behavior rather than the unreachable stricter schema.
const RacerPatchInput = RacerSchema.pick({
  name: true,
  team: true,
  image: true,
  teamColor: true,
}).partial();

export const racersRouter = {
  /** All racers. Ported read-only from app/api/racers/route.ts (GET). */
  list: authed
    .output(z.array(RacerSchema))
    .handler(async () => racersQuery.execute()),

  /**
   * Creates a racer. Site-admin only — the legacy `POST /api/racers` had no auth at
   * all, which was a gap; locking it down here is intended per the migration brief.
   */
  create: adminOnly
    .input(RacerSchema)
    .output(RacerSchema)
    .handler(async ({ input }) => {
      return await createRacerCommand.execute({
        racerId: input.id,
        name: input.name,
        team: input.team,
        motorsportId: input.motorsportId,
        image: input.image,
        teamColor: input.teamColor,
      });
    }),

  /** Updates a racer's profile fields. Site-admin only. */
  update: adminOnly
    .input(RacerIdInput.extend({ patch: RacerPatchInput }))
    .output(RacerSchema)
    .handler(async ({ input }) => {
      return await updateRacerCommand.execute({
        racerId: input.racerId,
        patch: input.patch,
      });
    }),

  /** Deletes a racer. Site-admin only. */
  delete: adminOnly
    .input(RacerIdInput)
    .output(z.object({ ok: z.literal(true) }))
    .handler(async ({ input }) => {
      await deleteRacerCommand.execute({ racerId: input.racerId });
      return { ok: true as const };
    }),
};
