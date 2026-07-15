import { NotFoundError } from "@/server/domain/errors";
import type { IRacerRepository } from "@/server/repositories";
import type {
  IUpdateRacerCommand,
  UpdateRacerPayload,
  UpdateRacerResult,
} from "./IUpdateRacerCommand";

export class BlobUpdateRacerCommand implements IUpdateRacerCommand {
  constructor(private racers: IRacerRepository) {}

  async execute(payload: UpdateRacerPayload): Promise<UpdateRacerResult> {
    const racer = await this.racers.findById(payload.racerId);
    if (!racer) {
      throw new NotFoundError("Racer", payload.racerId);
    }

    // "team" (DTO-facing) -> "constructor" (the entity's own mutation method,
    // server/domain/racer.ts's `updateProfile`) is the only field renamed here.
    const { team, ...rest } = payload.patch;
    racer.updateProfile({
      ...rest,
      ...(team !== undefined ? { constructor: team } : {}),
    });
    await this.racers.save(racer);

    return {
      id: racer.racerId,
      name: racer.name,
      team: racer.constructorName,
      motorsportId: racer.motorsportId,
      image: racer.image,
      teamColor: racer.teamColor,
    };
  }
}
