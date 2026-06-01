import { NextResponse } from "next/server";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobRaceRepository } from "@/server/repositories/blob/BlobRaceRepository";
import { BlobRacerRepository } from "@/server/repositories/blob/BlobRacerRepository";
import { BlobRacePredictionBookRepository } from "@/server/repositories/blob/BlobRacePredictionBookRepository";
import { BlobLeagueStandingsRepository } from "@/server/repositories/blob/BlobLeagueStandingsRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { PageInitService } from "@/server/services/PageInitService";

const pageSvc = new PageInitService(
  new BlobLeagueRepository(),
  new BlobRaceRepository(),
  new BlobRacerRepository(),
  new BlobRacePredictionBookRepository(),
  new BlobLeagueStandingsRepository(),
  new BlobTeamRepository(),
  new PrismaUserRepository(),
);

export async function GET() {
  return NextResponse.json(await pageSvc.getCreateInit());
}
