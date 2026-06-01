import { NextResponse } from "next/server";
import { z } from "zod";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobRaceRepository } from "@/server/repositories/blob/BlobRaceRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { BlobRacePredictionBookRepository } from "@/server/repositories/blob/BlobRacePredictionBookRepository";
import { BlobLeagueStandingsRepository } from "@/server/repositories/blob/BlobLeagueStandingsRepository";
import { PredictionService } from "@/server/services/PredictionService";
import { NotFoundError } from "@/server/domain/errors";

const predSvc = new PredictionService(
  new BlobLeagueRepository(),
  new BlobRaceRepository(),
  new BlobRacePredictionBookRepository(),
  new BlobLeagueStandingsRepository(),
  new BlobTeamRepository(),
);

const BodySchema = z.object({ motorsportId: z.string().uuid() });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const { raceId } = await params;
  const body = BodySchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  try {
    await predSvc.recalculate(body.data.motorsportId, raceId);
  } catch (e) {
    if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 });
    throw e;
  }

  return NextResponse.json({ ok: true });
}
