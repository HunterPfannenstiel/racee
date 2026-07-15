import { NotFoundError } from "@/server/domain/errors";
import type { IRacerRepository } from "@/server/repositories";
import type { IDeleteRacerCommand, DeleteRacerPayload } from "./IDeleteRacerCommand";

export class BlobDeleteRacerCommand implements IDeleteRacerCommand {
  constructor(private racers: IRacerRepository) {}

  async execute(payload: DeleteRacerPayload): Promise<void> {
    const racer = await this.racers.findById(payload.racerId);
    if (!racer) {
      throw new NotFoundError("Racer", payload.racerId);
    }
    await this.racers.remove(payload.racerId);
  }
}
