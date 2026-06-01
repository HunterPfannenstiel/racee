import type { IRacerRepository } from "@/server/repositories/interfaces";
import { Racer } from "@/server/domain/racer";
import { NotFoundError } from "@/server/domain/errors";

export class RacerService {
  constructor(private racers: IRacerRepository) {}

  async createRacer(data: {
    racerId: string;
    name: string;
    constructor: string;
    image?: string;
    teamColor?: string;
  }): Promise<void> {
    const racer = new Racer(data);
    await this.racers.save(racer);
  }

  async listRacers(): Promise<Racer[]> {
    return this.racers.findAll();
  }

  async getRacer(racerId: string): Promise<Racer> {
    const racer = await this.racers.findById(racerId);
    if (!racer) throw new NotFoundError("Racer", racerId);
    return racer;
  }

  async updateRacer(racerId: string, patch: Partial<{
    name: string;
    constructor: string;
    image: string;
    teamColor: string;
  }>): Promise<void> {
    const racer = await this.getRacer(racerId);
    racer.updateProfile(patch);
    await this.racers.save(racer);
  }

  async deleteRacer(racerId: string): Promise<void> {
    await this.racers.remove(racerId);
  }
}
