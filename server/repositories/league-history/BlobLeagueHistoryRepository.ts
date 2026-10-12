import { z } from "zod";
import { blob } from "@/lib/blob";
import { leagueHistoryPath } from "@/lib/paths";
import { LeagueHistory, SeasonRecordSchema } from "@/server/domain/league-history";
import { ParseError, PersistenceError } from "@/server/repositories/errors";
import type { ILeagueHistoryRepository } from "./ILeagueHistoryRepository";

const HistoryPersistenceSchema = z.object({
  leagueId: z.string(),
  seasons: z.array(SeasonRecordSchema),
});

export class BlobLeagueHistoryRepository implements ILeagueHistoryRepository {
  async findByLeague(leagueId: string): Promise<LeagueHistory> {
    const path = leagueHistoryPath(leagueId);
    let raw: unknown;
    try {
      raw = await blob.read<unknown>(path);
    } catch (e) {
      throw new PersistenceError("read", path, e);
    }
    if (raw === null) return LeagueHistory.empty(leagueId);
    try {
      const parsed = HistoryPersistenceSchema.parse(raw);
      return new LeagueHistory(leagueId, parsed.seasons);
    } catch (e) {
      throw new ParseError(path, e);
    }
  }

  async save(history: LeagueHistory): Promise<void> {
    const path = leagueHistoryPath(history.leagueId);
    try {
      await blob.write(path, { leagueId: history.leagueId, seasons: history.seasons });
    } catch (e) {
      throw new PersistenceError("write", path, e);
    }
  }
}
