import { getSession } from "./server";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { LeagueService } from "@/server/services/LeagueService";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new AuthError();
  if (!session.user.isAdmin) throw new AuthError("Forbidden");
  return session;
}

export async function requireCommissioner(leagueId: string) {
  const session = await getSession();
  if (!session) throw new AuthError();
  const svc = new LeagueService(
    new BlobLeagueRepository(),
    new BlobTeamRepository(),
    new PrismaUserRepository(),
  );
  const league = await svc.getLeague(leagueId);
  if (!league.canManage(session.user.id)) throw new AuthError("Forbidden");
  return { session, league };
}

export async function requireMember(leagueId: string) {
  const session = await getSession();
  if (!session) throw new AuthError();
  const leagueRepo = new BlobLeagueRepository();
  const league = await leagueRepo.findById(leagueId);
  if (!league || !league.isMember(session.user.id)) throw new AuthError("Forbidden");
  return { session, league };
}

export async function requireOwnerCommissioner(leagueId: string) {
  const session = await getSession();
  if (!session) throw new AuthError();
  const svc = new LeagueService(
    new BlobLeagueRepository(),
    new BlobTeamRepository(),
    new PrismaUserRepository(),
  );
  const league = await svc.getLeague(leagueId);
  if (league.commissionerId !== session.user.id) throw new AuthError("Forbidden");
  return { session, league };
}
