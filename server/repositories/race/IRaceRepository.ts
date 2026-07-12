import type { Race } from "@/server/domain/race";
export interface IRaceRepository {
  findAllForMotorsport(motorsportId: string): Promise<Race[]>;
  findById(motorsportId: string, raceId: string): Promise<Race | null>;
  save(race: Race): Promise<void>;
  remove(motorsportId: string, raceId: string): Promise<void>;
}
