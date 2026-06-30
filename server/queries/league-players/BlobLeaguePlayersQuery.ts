import { z } from "zod";
import { blob } from "@/lib/blob";
import { prisma } from "@/server/db";
import { LEAGUES_PATH } from "@/lib/paths";
import type { ILeaguePlayersQuery, LeaguePlayerDTO, LeaguePlayersResult } from "./ILeaguePlayersQuery";

const LeagueReadSchema = z.object({
  id: z.string(),
  commissionerId: z.string(),
  coCommissionerIds: z.array(z.string()).default([]),
  memberIds: z.array(z.string()).default([]),
  pendingMemberIds: z.array(z.string()).default([]),
});

export class BlobLeaguePlayersQuery implements ILeaguePlayersQuery {
  async execute(leagueId: string): Promise<LeaguePlayersResult> {
    const [rawLeagues, users] = await Promise.all([
      blob.read<unknown>(LEAGUES_PATH),
      prisma.user.findMany({ select: { id: true, name: true } }),
    ]);

    const leagues = z.array(LeagueReadSchema).parse(rawLeagues ?? []);
    const league = leagues.find((l) => l.id === leagueId);
    if (!league) return { members: [], pending: [] };

    const coCommissionerSet = new Set(league.coCommissionerIds);
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const members: LeaguePlayerDTO[] = league.memberIds
      .filter((id) => id !== league.commissionerId)
      .map((id) => ({
        id,
        name: userMap.get(id) ?? "Unknown",
        role: coCommissionerSet.has(id) ? "co-commissioner" as const : "member" as const,
      }));

    const pending: LeaguePlayerDTO[] = league.pendingMemberIds.map((id) => ({
      id,
      name: userMap.get(id) ?? "Unknown",
      role: "member" as const,
    }));

    return { members, pending };
  }
}
