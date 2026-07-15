import { Racer } from "@/server/domain/racer";
import type { IRacerRepository } from "@/server/repositories";
import type {
  ICreateRacerCommand,
  CreateRacerPayload,
  CreateRacerResult,
} from "./ICreateRacerCommand";

export class BlobCreateRacerCommand implements ICreateRacerCommand {
  constructor(private racers: IRacerRepository) {}

  async execute(payload: CreateRacerPayload): Promise<CreateRacerResult> {
    // Mirrors the legacy racer service's create-racer construction exactly (that
    // service has since been dissolved into this command per server/commands/AGENTS.md).
    const racer = new Racer({
      racerId: payload.racerId,
      name: payload.name,
      constructor: payload.team,
      motorsportId: payload.motorsportId,
      image: payload.image,
      teamColor: payload.teamColor,
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
