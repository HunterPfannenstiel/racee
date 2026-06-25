import { NextResponse } from "next/server";
import { PredictionMutationSchema } from "@/lib/schemas";
import { AuthError, requireMember } from "@/server/auth/guards";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobRaceRepository } from "@/server/repositories/blob/BlobRaceRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { BlobRacePredictionBookRepository } from "@/server/repositories/blob/BlobRacePredictionBookRepository";
import { BlobLeagueStandingsRepository } from "@/server/repositories/blob/BlobLeagueStandingsRepository";
import { PredictionService } from "@/server/services/PredictionService";

const raceRepo = new BlobRaceRepository();
const teamRepo = new BlobTeamRepository();
const predSvc = new PredictionService(
  new BlobLeagueRepository(),
  raceRepo,
  new BlobRacePredictionBookRepository(),
  new BlobLeagueStandingsRepository(),
  teamRepo,
);

export async function POST(request: Request) {
  const parsed = PredictionMutationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { leagueId, raceId, userId, racerIds, propPicks } = parsed.data;

  let session: Awaited<ReturnType<typeof requireMember>>["session"];
  try {
    ({ session } = await requireMember(leagueId));
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const callerId = session.user.id;
  const isProxy = callerId !== userId;

  if (isProxy) {
    const teams = await teamRepo.findAllForLeague(leagueId);
    const callerTeam = teams.find(t => t.memberIds.includes(callerId));
    if (!callerTeam || !callerTeam.memberIds.includes(userId)) {
      return NextResponse.json({ error: "You can only submit for teammates on your team." }, { status: 403 });
    }
  }

  const race = await raceRepo.findById(leagueId, raceId);
  if (race?.isLocked(new Date())) {
    return NextResponse.json({ error: "Race submissions are closed." }, { status: 423 });
  }

  const submittedBy = isProxy ? callerId : null;
  await predSvc.submitPrediction(leagueId, raceId, userId, racerIds, propPicks ?? {}, new Date().toISOString(), submittedBy);
  return NextResponse.json({ ok: true });
}
