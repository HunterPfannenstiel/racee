import type { ILeagueHistoryRepository, ILeagueRepository } from "@/server/repositories";
import { InvariantViolationError, NotFoundError } from "@/server/domain/errors";
import type { IImportPastSeasonCommand, ImportPastSeasonPayload } from "./IImportPastSeasonCommand";

/**
 * Adds a season played before Racee (or in another app) to a league's history
 * book from hand-entered final results. Site-admin only — enforced by the
 * procedure. Unprefixed — reads the league and writes its history.
 */
export class ImportPastSeasonCommand implements IImportPastSeasonCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly history: ILeagueHistoryRepository,
  ) {}

  async execute(payload: ImportPastSeasonPayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);

    const label = payload.label.trim();
    if (!label) throw new InvariantViolationError("Give the season a name");
    if (payload.players.length === 0) throw new InvariantViolationError("Add at least one player");

    const history = await this.history.findByLeague(league.leagueId);
    if (history.seasons.some((s) => s.label.toLowerCase() === label.toLowerCase())) {
      throw new InvariantViolationError(`There's already a "${label}" season in this league's history`);
    }

    // Sort imported seasons by their year when the name is one (e.g. "2024").
    const year = /^\d{4}/.exec(label)?.[0];
    const endedAt = year ? `${year}-12-31T00:00:00.000Z` : new Date().toISOString();

    history.addSeason({
      seasonId: crypto.randomUUID(),
      label,
      endedAt,
      imported: true,
      mulliganCount: 0,
      races: [],
      players: payload.players.map((p) => ({
        userId: p.userId,
        name: p.name.trim(),
        rank: p.rank,
        total: p.total,
        gross: p.gross ?? p.total,
        medals: p.medals,
        raceWins: p.raceWins ?? p.medals.gold,
        highScore: p.highScore,
      })),
      teams: payload.teams.map((t) => ({
        teamId: t.teamId,
        name: t.name.trim(),
        rank: t.rank,
        total: t.total,
        medals: t.medals,
        raceWins: t.raceWins ?? t.medals.gold,
        highScore: t.highScore,
        memberNames: t.memberNames,
      })),
    });
    await this.history.save(history);
  }
}
