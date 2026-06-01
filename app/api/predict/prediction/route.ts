import { NextResponse } from "next/server";
import { PredictionMutationSchema } from "@/lib/schemas";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobRaceRepository } from "@/server/repositories/blob/BlobRaceRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { BlobRacePredictionBookRepository } from "@/server/repositories/blob/BlobRacePredictionBookRepository";
import { BlobLeagueStandingsRepository } from "@/server/repositories/blob/BlobLeagueStandingsRepository";
import { PredictionService } from "@/server/services/PredictionService";

const raceRepo = new BlobRaceRepository();
const predSvc = new PredictionService(
  new BlobLeagueRepository(),
  raceRepo,
  new BlobRacePredictionBookRepository(),
  new BlobLeagueStandingsRepository(),
  new BlobTeamRepository(),
);

export async function POST(request: Request) {
  const parsed = PredictionMutationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { leagueId, raceId, userId, racerIds, propPicks } = parsed.data;

  const race = await raceRepo.findById(leagueId, raceId);
  if (race?.isLocked(new Date())) {
    return NextResponse.json({ error: "Race submissions are closed." }, { status: 423 });
  }

  await predSvc.submitPrediction(leagueId, raceId, userId, racerIds, propPicks ?? {}, new Date().toISOString());
  return NextResponse.json({ ok: true });
}
