import { NextResponse } from "next/server";
import { CommissionerPredictionMutationSchema } from "@/lib/schemas";
import { AuthError, requireCommissioner } from "@/server/auth/guards";
import { getSession } from "@/server/auth/server";
import { AuthorizationError, NotFoundError } from "@/server/domain/errors";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import { BlobRaceRepository } from "@/server/repositories/race/BlobRaceRepository";
import { BlobTeamRepository } from "@/server/repositories/team/BlobTeamRepository";
import { BlobRacePredictionBookRepository } from "@/server/repositories/race-prediction-book/BlobRacePredictionBookRepository";
import { BlobLeagueStandingsRepository } from "@/server/repositories/league-standings/BlobLeagueStandingsRepository";
import { PredictionService } from "@/server/services/PredictionService";
import { RecalculateRaceCommand } from "@/server/commands/recalculate-race/RecalculateRaceCommand";
import { BlobCommissionerPlayerPredictionsQuery } from "@/server/queries/commissioner-player-predictions/BlobCommissionerPlayerPredictionsQuery";

const leagueRepo = new BlobLeagueRepository();
const raceRepo = new BlobRaceRepository();
const teamRepo = new BlobTeamRepository();
const bookRepo = new BlobRacePredictionBookRepository();
const standingsRepo = new BlobLeagueStandingsRepository();
const predSvc = new PredictionService(bookRepo);
const recalculateRaceCommand = new RecalculateRaceCommand(raceRepo, leagueRepo, bookRepo, standingsRepo, teamRepo);
const playerPredictionsQuery = new BlobCommissionerPlayerPredictionsQuery(leagueRepo);

export async function GET(
  _: Request,
  { params }: { params: Promise<{ leagueId: string; userId: string }> },
) {
  try {
    const { leagueId, userId } = await params;
    const session = await getSession();
    if (!session) throw new AuthError();
    // Resource-scoped "is this user the commissioner of this league" check
    // now lives inside the query (via Roles), not here.
    return NextResponse.json(await playerPredictionsQuery.execute(leagueId, userId, session.user.id));
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    if (e instanceof AuthorizationError) return NextResponse.json({ error: e.message }, { status: 403 });
    if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 });
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
      await recalculateRaceCommand.execute({ motorsportId: race.motorsportId, raceId });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
