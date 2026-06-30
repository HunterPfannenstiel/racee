import { NextResponse } from "next/server";
import { CommissionerPredictionMutationSchema } from "@/lib/schemas";
import { AuthError, requireCommissioner } from "@/server/auth/guards";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobRaceRepository } from "@/server/repositories/blob/BlobRaceRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { BlobRacePredictionBookRepository } from "@/server/repositories/blob/BlobRacePredictionBookRepository";
import { BlobLeagueStandingsRepository } from "@/server/repositories/blob/BlobLeagueStandingsRepository";
import { PredictionService } from "@/server/services/PredictionService";
import { BlobCommissionerPlayerPredictionsQuery } from "@/server/queries/commissioner-player-predictions/BlobCommissionerPlayerPredictionsQuery";

const raceRepo = new BlobRaceRepository();
const predSvc = new PredictionService(
  new BlobLeagueRepository(),
  raceRepo,
  new BlobRacePredictionBookRepository(),
  new BlobLeagueStandingsRepository(),
  new BlobTeamRepository(),
);
const playerPredictionsQuery = new BlobCommissionerPlayerPredictionsQuery();

export async function GET(
  _: Request,
  { params }: { params: Promise<{ leagueId: string; userId: string }> },
) {
  try {
    const { leagueId, userId } = await params;
    await requireCommissioner(leagueId);
    return NextResponse.json(await playerPredictionsQuery.execute(leagueId, userId));
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ leagueId: string; userId: string }> },
) {
  try {
    const { leagueId, userId } = await params;
    const { session, league } = await requireCommissioner(leagueId);

    const parsed = CommissionerPredictionMutationSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { raceId, racerIds, propPicks } = parsed.data;

    const race = await raceRepo.findById(league.motorsportId, raceId);
    if (!race) return NextResponse.json({ error: "Race not found" }, { status: 404 });

    // No lock check — bypassing the lock is the entire point of this route.
    await predSvc.submitPrediction(
      leagueId,
      raceId,
      userId,
      racerIds,
      propPicks ?? {},
      new Date().toISOString(),
      session.user.id,
    );

    if (race.keySetAt !== null) {
      await predSvc.recalculate(race.motorsportId, raceId);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
