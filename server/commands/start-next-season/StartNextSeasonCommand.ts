import type {
  ILeagueHistoryRepository,
  ILeagueRepository,
  ILeagueStandingsRepository,
  INotificationRepository,
  IRaceRepository,
  ITeamRepository,
  IUserRepository,
} from "@/server/repositories";
import { InvariantViolationError, NotFoundError } from "@/server/domain/errors";
import { LeagueStandings } from "@/server/domain/league-standings";
import { assertLeagueCommissioner } from "@/server/roles/league";
import { buildSeasonRecord, seasonParticipantIds } from "@/server/services/season-record";
import type { IStartNextSeasonCommand, StartNextSeasonPayload } from "./IStartNextSeasonCommand";

/**
 * Freezes the ended season into the league's history book, then starts a fresh
 * one: empty standings, only the carried-over players, and teams either kept as
 * franchises (same team, history continues) or wiped. Settings carry over.
 * Commissioner-only. Unprefixed — spans many repositories.
 */
export class StartNextSeasonCommand implements IStartNextSeasonCommand {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly races: IRaceRepository,
    private readonly standings: ILeagueStandingsRepository,
    private readonly teams: ITeamRepository,
    private readonly users: IUserRepository,
    private readonly history: ILeagueHistoryRepository,
    private readonly notifications: INotificationRepository,
  ) {}

  async execute(payload: StartNextSeasonPayload): Promise<void> {
    const league = await this.leagues.findById(payload.leagueId);
    if (!league) throw new NotFoundError("League", payload.leagueId);
    assertLeagueCommissioner(payload.actorUserId, league);
    if (!league.isSeasonEnded) throw new InvariantViolationError("End the current season before starting the next one");

    const label = payload.label.trim();
    if (!label) throw new InvariantViolationError("Give the new season a name");

    const [allRaces, standings, teams, history] = await Promise.all([
      this.races.findAllForMotorsport(league.motorsportId),
      this.standings.findByLeague(league.leagueId),
      this.teams.findAllForLeague(league.leagueId),
      this.history.findByLeague(league.leagueId),
    ]);
    if (history.seasons.some((s) => s.label.toLowerCase() === label.toLowerCase())) {
      throw new InvariantViolationError(`There's already a "${label}" season in this league's history`);
    }

    const seasonRaces = league.currentSeasonRaces(allRaces);
    const users = await this.users.findByIds(seasonParticipantIds(standings, teams));
    const now = new Date().toISOString();

    // 1. Freeze the finished season.
    history.addSeason(
      buildSeasonRecord({
        seasonId: league.currentSeasonId ?? crypto.randomUUID(),
        label: league.displaySeasonLabel(seasonRaces, now.slice(0, 4)),
        endedAt: league.seasonEndedAt ?? now,
        league,
        races: seasonRaces,
        standings,
        teams,
        namesById: new Map(users.map((u) => [u.userId, u.name])),
      }),
    );
    await this.history.save(history);

    // 2. New season: carried-over players only, fresh standings.
    const keep = new Set(payload.keepUserIds.filter((id) => league.memberIds.includes(id)));
    league.startNextSeason({ label, keepUserIds: [...keep] });
    await this.leagues.save(league);
    await this.standings.save(LeagueStandings.empty(league.leagueId));

    // 3. Teams: keep as franchises (dropping players who didn't carry over) or wipe.
    if (payload.teams === "reset") {
      for (const team of teams) await this.teams.remove(league.leagueId, team.teamId);
    } else {
      for (const team of teams) {
        for (const id of team.memberIds) if (!league.memberIds.includes(id)) team.removeMember(id);
      }
      await this.teams.saveAll(teams);
    }

    for (const userId of league.memberIds) {
      await this.notifications.add(userId, {
        id: crypto.randomUUID(),
        kind: "season_started",
        title: `${league.name}: the ${label} season is on`,
        body: "You're in for the new season. Last season is saved in the league history on the standings page.",
        createdAt: now,
        read: false,
      });
    }
  }
}
