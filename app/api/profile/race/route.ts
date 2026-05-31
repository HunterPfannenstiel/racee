import { NextResponse } from "next/server";
import * as leagueRepository from "@/server/repositories/league";
import * as predictionRepository from "@/server/repositories/prediction";
import * as scoreRepository from "@/server/repositories/score";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");
  const raceId = searchParams.get("raceId");
  const userId = searchParams.get("userId");

  if (!leagueId || !raceId || !userId) {
    return NextResponse.json({ error: "leagueId, raceId, and userId are required" }, { status: 400 });
  }

  const [predictions, scores, league] = await Promise.all([
    predictionRepository.getForRace(leagueId, raceId),
    scoreRepository.get(leagueId, raceId),
    leagueRepository.getById(leagueId),
  ]);

  const userScore = scores?.entries.find((e) => e.userId === userId) ?? null;
  const sortedEntries = scores
    ? [...scores.entries].sort((a, b) => b.gridPoints + b.propPoints - (a.gridPoints + a.propPoints))
    : [];
  const rank = userScore ? sortedEntries.findIndex((e) => e.userId === userId) + 1 : null;

  return NextResponse.json({
    prediction: predictions?.predictions[userId] ?? null,
    key: predictions?.key ?? null,
    propPicks: predictions?.propPicks[userId] ?? {},
    propKey: predictions?.propKey ?? null,
    scores: userScore,
    rank,
    totalParticipants: sortedEntries.length,
    placementPoints: league?.placementPoints ?? [],
    propPointValues: league?.propPointValues ?? null,
  });
}
