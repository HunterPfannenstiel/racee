import { NextResponse } from "next/server";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import type { League } from "@/server/domain/league";
import type { User } from "@/server/domain/user";

const leagueRepo = new BlobLeagueRepository();
const userRepo = new PrismaUserRepository();

function serLeague(l: League) {
  return { id: l.leagueId, name: l.name, placementPoints: [...l.placementPoints], mulliganCount: l.mulliganCount, scoringDepth: l.scoringDepth, stageCount: l.stageCount, propPointValues: { ...l.propPointValues } };
}

function serUser(u: User) {
  return { id: u.userId, name: u.name };
}

export async function GET() {
  const [users, leagues] = await Promise.all([userRepo.findAll(), leagueRepo.findAll()]);
  return NextResponse.json({ users: users.map(serUser), leagues: leagues.map(serLeague) });
}
