import { NextResponse } from "next/server";
import { PredictionMutationSchema } from "@/lib/schemas";
import * as raceRepository from "@/server/repositories/race";
import * as predictionRepository from "@/server/repositories/prediction";

export async function POST(request: Request) {
  const parsed = PredictionMutationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { leagueId, raceId, userId, racerIds, propPicks } = parsed.data;

  const races = await raceRepository.getForLeague(leagueId);
  const race = races.find((r) => r.id === raceId);
  if (race?.lockTime && Date.now() >= new Date(race.lockTime).getTime()) {
    return NextResponse.json({ error: "Race submissions are closed." }, { status: 423 });
  }

  await predictionRepository.submitPrediction(leagueId, raceId, userId, racerIds, propPicks ?? {});
  return NextResponse.json({ ok: true });
}
