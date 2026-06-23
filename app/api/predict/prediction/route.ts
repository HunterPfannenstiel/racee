import { NextResponse } from "next/server";
import { PredictionMutationSchema } from "@/lib/schemas";
import { getSession } from "@/server/auth/server";
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
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = PredictionMutationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { leagueId, raceId, userId, racerIds, propPicks } = parsed.data;
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
