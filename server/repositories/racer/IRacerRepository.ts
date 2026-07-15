import type { Racer } from "@/server/domain/racer";
export interface IRacerRepository {
  findAll(): Promise<Racer[]>;
  findById(racerId: string): Promise<Racer | null>;
  save(racer: Racer): Promise<void>;
  remove(racerId: string): Promise<void>;
}
