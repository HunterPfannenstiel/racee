import { blob } from "@/lib/blob";
import { teamsPath } from "@/lib/paths";
import { Team } from "@/lib/schemas";

export async function getForLeague(leagueId: string): Promise<Team[]> {
  return (await blob.read<Team[]>(teamsPath(leagueId))) ?? [];
}

export async function create(leagueId: string, team: Omit<Team, "memberIds">): Promise<void> {
  const teams = await getForLeague(leagueId);
  await blob.write(teamsPath(leagueId), [...teams, { ...team, memberIds: [] }]);
}

export async function update(leagueId: string, teamId: string, data: Partial<Pick<Team, "name" | "color">>): Promise<void> {
  const teams = await getForLeague(leagueId);
  await blob.write(teamsPath(leagueId), teams.map((t) => (t.id === teamId ? { ...t, ...data } : t)));
}

export async function updateMembers(leagueId: string, teamId: string, memberIds: string[]): Promise<void> {
  const teams = await getForLeague(leagueId);
  await blob.write(teamsPath(leagueId), teams.map((t) => (t.id === teamId ? { ...t, memberIds } : t)));
}

export async function remove(leagueId: string, teamId: string): Promise<void> {
  const teams = await getForLeague(leagueId);
  await blob.write(teamsPath(leagueId), teams.filter((t) => t.id !== teamId));
}
