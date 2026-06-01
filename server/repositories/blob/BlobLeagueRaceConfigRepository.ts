import { z } from "zod";
import { blob } from "@/lib/blob";
import { leagueRaceConfigPath } from "@/lib/paths";
import { LeagueRaceConfig } from "@/server/domain/league-race-config";
import { ParseError, PersistenceError } from "@/server/domain/errors";
import type { ILeagueRaceConfigRepository } from "../interfaces/ILeagueRaceConfigRepository";

const LeagueRaceConfigPersistenceSchema = z.object({
  leagueId: z.string().uuid(),
  raceId: z.string().uuid(),
  lockTime: z.string().datetime(),
});

export class BlobLeagueRaceConfigRepository implements ILeagueRaceConfigRepository {
  async findConfig(leagueId: string, raceId: string): Promise<LeagueRaceConfig | null> {
    const path = leagueRaceConfigPath(leagueId, raceId);
    let raw: unknown;
    try {
      raw = await blob.read<unknown>(path);
    } catch (e) {
      throw new PersistenceError("read", path, e);
    }
    if (raw === null) return null;
    try {
      const parsed = LeagueRaceConfigPersistenceSchema.parse(raw);
      return new LeagueRaceConfig(parsed);
    } catch (e) {
      throw new ParseError(path, e);
    }
  }

  async save(config: LeagueRaceConfig): Promise<void> {
    const path = leagueRaceConfigPath(config.leagueId, config.raceId);
    try {
      await blob.write(path, { leagueId: config.leagueId, raceId: config.raceId, lockTime: config.lockTime });
    } catch (e) {
      throw new PersistenceError("write", path, e);
    }
  }
}
