import { NextResponse } from "next/server";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobRaceRepository } from "@/server/repositories/blob/BlobRaceRepository";
import { BlobRacerRepository } from "@/server/repositories/blob/BlobRacerRepository";
import { BlobRacePredictionBookRepository } from "@/server/repositories/blob/BlobRacePredictionBookRepository";
import { BlobLeagueStandingsRepository } from "@/server/repositories/blob/BlobLeagueStandingsRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { PageInitService } from "@/server/services/PageInitService";
import { AuthError, requireMember } from "@/server/auth/guards";

const pageSvc = new PageInitService(
  new BlobLeagueRepository(),
  new BlobRaceRepository(),
  new BlobRacerRepository(),
  new BlobRacePredictionBookRepository(),
  new BlobLeagueStandingsRepository(),
  new BlobTeamRepository(),
  new PrismaUserRepository(),
);

export async function GET(
  _: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params;
  try {
    await requireMember(leagueId);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
  return NextResponse.json(await pageSvc.getViewInit(leagueId));
}
