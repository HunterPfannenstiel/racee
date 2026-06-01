import { NextResponse } from "next/server";
import { KeyMutationSchema } from "@/lib/schemas";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobRaceRepository } from "@/server/repositories/blob/BlobRaceRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { BlobRacePredictionBookRepository } from "@/server/repositories/blob/BlobRacePredictionBookRepository";
import { BlobLeagueStandingsRepository } from "@/server/repositories/blob/BlobLeagueStandingsRepository";
import { PredictionService } from "@/server/services/PredictionService";

const books = new BlobRacePredictionBookRepository();
const standingsRepo = new BlobLeagueStandingsRepository();
const predSvc = new PredictionService(
  new BlobLeagueRepository(),
  new BlobRaceRepository(),
  books,
  standingsRepo,
  new BlobTeamRepository(),
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");
  const raceId = searchParams.get("raceId");
  if (!leagueId) return NextResponse.json({ error: "Missing leagueId" }, { status: 400 });

  if (raceId) {
    const book = await books.findByRace(leagueId, raceId);
    return NextResponse.json({
      key: book?.keyOrder ? [...book.keyOrder] : null,
      keySetAt: book?.keySetAt ?? null,
      propKey: book?.propKey ?? null,
    });
  }

  const standings = await standingsRepo.findByLeague(leagueId);
  const gradedIds = standings?.gradedRaceIds ?? [];
  const entries = await Promise.all(
    gradedIds.map(async (id) => {
      const book = await books.findByRace(leagueId, id);
      return [id, book?.keySetAt ?? null] as [string, string | null];
    }),
  );
  return NextResponse.json(Object.fromEntries(entries));
}

export async function PUT(request: Request) {
  const parsed = KeyMutationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { leagueId, raceId, racerIds: keyOrder, propKey } = parsed.data;
  await predSvc.setAnswerKey(leagueId, raceId, keyOrder, propKey, new Date().toISOString());
  return NextResponse.json({ ok: true });
}
