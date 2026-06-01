import { NextResponse } from "next/server";
import { KeyMutationSchema } from "@/lib/schemas";
import { BlobRaceRepository } from "@/server/repositories/blob/BlobRaceRepository";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const motorsportId = searchParams.get("motorsportId");
  const raceId = searchParams.get("raceId");

  if (!motorsportId) return NextResponse.json({ error: "Missing motorsportId" }, { status: 400 });

  if (raceId) {
    const race = await raceRepo.findById(motorsportId, raceId);
    if (!race) return NextResponse.json({ error: "Race not found" }, { status: 404 });
    return NextResponse.json({
      key: race.keyOrder ? [...race.keyOrder] : null,
      keySetAt: race.keySetAt,
      propKey: race.propKey,
    });
  }

  const races = await raceRepo.findAllForMotorsport(motorsportId);
  const entries = races
    .filter(r => r.keySetAt !== null)
    .map(r => [r.raceId, r.keySetAt] as [string, string]);
  return NextResponse.json(Object.fromEntries(entries));
}

export async function PUT(request: Request) {
  const parsed = KeyMutationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { motorsportId, raceId, racerIds: keyOrder, propKey } = parsed.data;
  await predSvc.setAnswerKey(motorsportId, raceId, keyOrder, propKey, new Date().toISOString());
  return NextResponse.json({ ok: true });
}
