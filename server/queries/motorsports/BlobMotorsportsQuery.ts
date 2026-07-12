import type { IMotorsportRepository } from "@/server/repositories";
import type { Motorsport } from "@/server/domain/motorsport";
import type { IMotorsportsQuery, MotorsportDTO } from "./IMotorsportsQuery";

function serialize(m: Motorsport): MotorsportDTO {
  return { id: m.motorsportId, name: m.name, slug: m.slug };
}

export class BlobMotorsportsQuery implements IMotorsportsQuery {
  constructor(private motorsports: IMotorsportRepository) {}

  async execute(): Promise<MotorsportDTO[]> {
    const all = await this.motorsports.findAll();
    return all.map(serialize);
  }
}
