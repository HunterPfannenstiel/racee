import { NextResponse } from "next/server";
import { blob } from "@/lib/blob";
import { predictionsPath, scoresPath, LEAGUES_PATH } from "@/lib/paths";
import { PredictionsFile, RaceScores, League } from "@/lib/schemas";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");
  const raceId = searchParams.get("raceId");
  const userId = searchParams.get("userId");

  if (!leagueId || !raceId || !userId) {
    return NextResponse.json({ error: "leagueId, raceId, and userId are required" }, { status: 400 });
  }

  const [predictions, scores, leagues] = await Promise.all([
    blob.read<PredictionsFile>(predictionsPath(leagueId, raceId)),
    blob.read<RaceScores>(scoresPath(leagueId, raceId)),
    blob.read<League[]>(LEAGUES_PATH),
  ]);

  const league = leagues?.find(l => l.id === leagueId);

  const userScore = scores?.entries.find(e => e.userId === userId) ?? null;
  const sortedEntries = scores
    ? [...scores.entries].sort((a, b) => (b.gridPoints + b.propPoints) - (a.gridPoints + a.propPoints))
    : [];
  const rank = userScore ? sortedEntries.findIndex(e => e.userId === userId) + 1 : null;

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
