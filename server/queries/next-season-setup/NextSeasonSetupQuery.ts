import type {
  ILeagueHistoryRepository,
  ILeagueRepository,
  IMotorsportCalendarRepository,
  IRaceRepository,
  ITeamRepository,
  IUserRepository,
} from "@/server/repositories";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import { nextSeasonWindow } from "@/server/services/season-window";
import type { INextSeasonSetupQuery, NextSeasonSetupResult } from "./INextSeasonSetupQuery";

/** Everything the "next season" draft page starts from. Commissioners only. */
export class NextSeasonSetupQuery implements INextSeasonSetupQuery {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly races: IRaceRepository,
    private readonly teams: ITeamRepository,
    private readonly users: IUserRepository,
    private readonly history: ILeagueHistoryRepository,
    private readonly calendars: IMotorsportCalendarRepository,
  ) {}

  async execute(input: { actorUserId: string; leagueId: string }): Promise<NextSeasonSetupResult> {
    const league = await this.leagues.findById(input.leagueId);
    if (!league) throw new NotFoundError("League", input.leagueId);
    assertLeagueCommissioner(input.actorUserId, league);

    const [allRaces, teams, history, calendar, allLeagues] = await Promise.all([
      this.races.findAllForMotorsport(league.motorsportId),
      this.teams.findAllForLeague(league.leagueId),
      this.history.findByLeague(league.leagueId),
      this.calendars.findByMotorsport(league.motorsportId),
      this.leagues.findAll(),
    ]);

    const now = new Date().toISOString();
    const currentLabel = league.displaySeasonLabel(league.currentSeasonRaces(allRaces), now.slice(0, 4));
    const window = nextSeasonWindow(league, calendar);
    const next = window.seasonId ? calendar.find(window.seasonId) : null;
    const yearGuess = /^\d{4}$/.test(currentLabel) ? String(Number(currentLabel) + 1) : String(Number(now.slice(0, 4)) + 1);

    // People to add: past players of this league, then players from the commissioner's other leagues.
    const memberSet = new Set(league.memberIds);
    const candidateFrom = new Map<string, string>();
    for (const season of [...history.seasons].reverse()) {
      for (const p of season.players) {
        if (p.userId && !memberSet.has(p.userId) && !candidateFrom.has(p.userId)) candidateFrom.set(p.userId, `Played ${season.label}`);
      }
    }
    for (const other of allLeagues) {
      if (other.leagueId === league.leagueId || !(other.isMember(input.actorUserId) || other.canManage(input.actorUserId))) continue;
      for (const id of other.memberIds) {
        if (!memberSet.has(id) && !candidateFrom.has(id)) candidateFrom.set(id, other.name);
      }
    }

    const users = await this.users.findByIds([...new Set([...league.memberIds, ...candidateFrom.keys()])]);
    const nameOf = new Map(users.map((u) => [u.userId, u.name]));

    const pastTeams = new Map<string, { teamId: string; name: string; lastSeason: string }>();
    for (const t of teams) pastTeams.set(t.teamId, { teamId: t.teamId, name: t.name, lastSeason: currentLabel });
    for (const season of [...history.seasons].reverse()) {
      for (const t of season.teams) {
        if (t.teamId && !pastTeams.has(t.teamId)) pastTeams.set(t.teamId, { teamId: t.teamId, name: t.name, lastSeason: season.label });
      }
    }

    return {
      leagueId: league.leagueId,
      leagueName: league.name,
      currentLabel,
      ended: league.isSeasonEnded,
      nextSeason: next ? { label: next.label, startDate: next.startDate, endDate: next.endDate } : null,
      suggestedLabel: next?.label ?? yearGuess,
      takenLabels: [...history.seasons.map((s) => s.label), currentLabel],
      members: league.memberIds
        .map((id) => ({ id, name: nameOf.get(id) ?? "Unknown player" }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      candidates: [...candidateFrom.entries()]
        .filter(([id]) => nameOf.has(id))
        .map(([id, from]) => ({ id, name: nameOf.get(id)!, from }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      teams: teams.map((t) => ({
        teamId: t.teamId,
        name: t.name,
        color: t.color ?? null,
        memberIds: [...t.memberIds],
        previousTeamIds: [...t.previousTeamIds],
      })),
      pastTeams: [...pastTeams.values()],
      settings: {
        id: league.leagueId,
        name: league.name,
        placementPoints: [...league.placementPoints],
        mulliganCount: league.mulliganCount,
        scoringDepth: league.scoringDepth,
        stageCount: league.stageCount,
        propPointValues: { ...league.propPointValues },
        motorsportId: league.motorsportId,
        teamPositionPoints: league.teamPositionPoints ? [...league.teamPositionPoints] : undefined,
      },
    };
  }
}
