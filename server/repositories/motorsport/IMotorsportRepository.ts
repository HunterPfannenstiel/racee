import type { Motorsport } from "@/server/domain/motorsport";
export interface IMotorsportRepository {
  findAll(): Promise<Motorsport[]>;
  findById(motorsportId: string): Promise<Motorsport | null>;
  save(motorsport: Motorsport): Promise<void>;
}
