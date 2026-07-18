import type { IRacerRepository } from "@/server/repositories";
import type { Racer } from "@/server/domain/racer";
import type { IRacersQuery, RacerDTO } from "./IRacersQuery";

// Field-by-field mapping via the entity's getters — never spread `racer`'s
// underlying props or use zod .pick/.omit against the domain schema here.
// The domain field is literally named "constructor" (server/domain/racer.ts),
// which collides with Object.prototype.constructor; the getter
// `constructorName` sidesteps that entirely, and the DTO renames it to "team".
function serialize(racer: Racer): RacerDTO {
  return {
    id: racer.racerId,
    name: racer.name,
    team: racer.constructorName,
    motorsportId: racer.motorsportId,
    image: racer.image,
    teamColor: racer.teamColor,
  };
}

export class BlobRacersQuery implements IRacersQuery {
  constructor(private racers: IRacerRepository) {}

  async execute(): Promise<RacerDTO[]> {
    const all = await this.racers.findAll();
    return all.map(serialize);
  }
}
