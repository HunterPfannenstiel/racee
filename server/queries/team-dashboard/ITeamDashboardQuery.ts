import type { PropName } from "@/lib/schemas";

export type PropAccuracyStat = { propType: PropName; correct: number; total: number; accuracy: number };

export type BestRaceStat = { raceId: string; title: string; points: number } | null;

export type TeamMemberStatsDTO = {
  userId: string;
  name: string;
  /** Season driver total in this league, mulligans applied (same as the standings Total). */
  driverTotal: number;
  /** Place in this league's driver standings. */
  driverRank: number | null;
  gridPoints: number;
  propPoints: number;
  racesScored: number;
  /** Average grid + prop points per graded race. */
  avgPerRace: number;
  bestRace: BestRaceStat;
  /** Points this member has added to the team's constructor total. */
  teamContribution: number;
  /** teamContribution as a share of the team's constructor total (0–1). */
  contributionShare: number;
  racesPredicted: number;
  propsCalled: number;
  propAccuracy: number;
  propAccuracyByType: PropAccuracyStat[];
};

export type TeamSummaryDTO = {
  id: string;
  name: string;
  color: string | null;
  logo: string | null;
  memberCount: number;
  /** Constructor total: sum of weekly team points. 0 when the league has no team scoring. */
  teamPoints: number;
  /** Place in the constructor standings (null without team scoring). */
  teamRank: number | null;
  avgTeamPointsPerRace: number;
  /** Members' driver totals added together. */
  combinedDriverPoints: number;
  avgDriverPointsPerMember: number;
  propAccuracy: number;
};

export type TeamRaceDTO = {
  raceId: string;
  title: string;
  label: string | null;
  teamPoints: number;
  /** This team's place among all teams for this race only. */
  rankThatRace: number | null;
  /** Member with the most grid + prop points that race. */
  topMember: { userId: string; name: string; points: number } | null;
};

export type TeamDashboardResult = {
  teamScoringEnabled: boolean;
  teamCount: number;
  /** The team being shown (null when the league has no teams). */
  team: TeamSummaryDTO | null;
  /** Gap to the constructor leader (0 when leading). */
  pointsBehindLeader: number;
  members: TeamMemberStatsDTO[];
  teamPropAccuracyByType: PropAccuracyStat[];
  races: TeamRaceDTO[];
  /** Every team in the league, sorted by constructor total (or combined driver points). */
  leagueTeams: TeamSummaryDTO[];
  leagueAverages: {
    teamPoints: number;
    avgTeamPointsPerRace: number;
    combinedDriverPoints: number;
    avgDriverPointsPerMember: number;
    propAccuracy: number;
  };
  /** The viewer's own team in this league, if any. */
  viewerTeamId: string | null;
};

export interface ITeamDashboardQuery {
  /** Team stats for one league. `teamId` null = the viewer's team (or the first team). Members only. */
  execute(leagueId: string, teamId: string | null, actorUserId: string): Promise<TeamDashboardResult>;
}
