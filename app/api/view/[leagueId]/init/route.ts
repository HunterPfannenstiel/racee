import { NextResponse } from "next/server";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import { BlobRaceRepository } from "@/server/repositories/race/BlobRaceRepository";
import { BlobRacerRepository } from "@/server/repositories/racer/BlobRacerRepository";
import { BlobRacePredictionBookRepository } from "@/server/repositories/race-prediction-book/BlobRacePredictionBookRepository";
import { BlobLeagueStandingsRepository } from "@/server/repositories/league-standings/BlobLeagueStandingsRepository";
import { BlobTeamRepository } from "@/server/repositories/team/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/user/PrismaUserRepository";
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
