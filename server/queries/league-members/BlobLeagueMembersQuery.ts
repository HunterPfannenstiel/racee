import { z } from "zod";
import { blob } from "@/lib/blob";
import { prisma } from "@/server/db";
import { LEAGUES_PATH } from "@/lib/paths";
import type { ILeagueMembersQuery, LeagueMemberDTO } from "./ILeagueMembersQuery";

const LeagueReadSchema = z.object({
  id: z.string(),
  commissionerId: z.string(),
  coCommissionerIds: z.array(z.string()).default([]),
});

export class BlobLeagueMembersQuery implements ILeagueMembersQuery {
  async execute(leagueId: string): Promise<LeagueMemberDTO[]> {
    const [rawLeagues, users] = await Promise.all([
      blob.read<unknown>(LEAGUES_PATH),
      prisma.user.findMany({ select: { id: true, name: true } }),
    ]);

    const leagues = z.array(LeagueReadSchema).parse(rawLeagues ?? []);
    const league = leagues.find((l) => l.id === leagueId);
    if (!league) return [];

    const coCommissionerSet = new Set(league.coCommissionerIds);

    return users
      .filter((u) => u.id !== league.commissionerId)
      .map((u) => ({
        id: u.id,
        name: u.name,
        role: coCommissionerSet.has(u.id) ? "co-commissioner" as const : "member" as const,
      }));
  }
}
