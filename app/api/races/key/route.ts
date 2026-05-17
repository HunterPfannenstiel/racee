import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { PredictionSchema, Race, Prediction, RaceScores, SeasonStandings, Participants } from "@/lib/schemas";
import { overwriteBlob, readBlob, readBlobUrl } from "@/lib/blob";
import { keyPath, racePath, scoresPath, standingsPath } from "@/lib/paths";
import { computeGridPoints, assignMedals, computeTeamRaceScores } from "@/lib/scoring";

export async function PUT(request: Request) {
  const parsed = PredictionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { seasonId, raceId, racerIds: keyOrder } = parsed.data;

  const [, { blobs }, race, existingStandings, participants] = await Promise.all([
    overwriteBlob(keyPath(seasonId, raceId), parsed.data),
    list({ prefix: `seasons/${seasonId}/races/${raceId}/predictions/` }),
    readBlob<Race>(racePath(seasonId, raceId)),
    readBlob<SeasonStandings>(standingsPath(seasonId)),
    readBlob<Participants>("participants.json"),
  ]);

  if (!race) return NextResponse.json({ error: "Race not found" }, { status: 404 });

  const userBlobs = blobs.filter((b) => !b.pathname.endsWith("/key.json"));
  const predictions = await Promise.all(userBlobs.map((b) => readBlobUrl<Prediction>(b.url)));

  const rawEntries = predictions.map((p) => ({
    userId: p.userId,
    gridPoints: computeGridPoints(p.racerIds, keyOrder),
  }));
  const entries = assignMedals(rawEntries);
  const raceScores: RaceScores = { raceId, seasonId, raceTitle: race.title, raceDate: race.date, entries };
  const teamRaceScores = computeTeamRaceScores(entries, participants?.teams ?? []);

  const existing = existingStandings ?? { seasonId, gradedRaceIds: [], individual: [], teams: [] };
  const stripped = {
    ...existing,
    gradedRaceIds: existing.gradedRaceIds.filter((id) => id !== raceId),
    individual: existing.individual.map((u) => ({
      ...u,
      raceScores: u.raceScores.filter((s) => s.raceId !== raceId),
    })),
    teams: existing.teams.map((t) => ({
      ...t,
      raceScores: t.raceScores.filter((s) => s.raceId !== raceId),
    })),
  };

  const updatedIndividual = [...stripped.individual];
  for (const entry of entries) {
    const idx = updatedIndividual.findIndex((u) => u.userId === entry.userId);
    const newScore = { raceId, points: entry.gridPoints };
    if (idx >= 0) {
      updatedIndividual[idx] = { ...updatedIndividual[idx], raceScores: [...updatedIndividual[idx].raceScores, newScore] };
    } else {
      updatedIndividual.push({ userId: entry.userId, raceScores: [newScore] });
    }
  }

  const updatedTeams = [...stripped.teams];
  for (const teamScore of teamRaceScores) {
    const idx = updatedTeams.findIndex((t) => t.teamId === teamScore.teamId);
    const newScore = { raceId, points: teamScore.points };
    if (idx >= 0) {
      updatedTeams[idx] = { ...updatedTeams[idx], raceScores: [...updatedTeams[idx].raceScores, newScore] };
    } else {
      updatedTeams.push({ teamId: teamScore.teamId, raceScores: [newScore] });
    }
  }

  const newStandings: SeasonStandings = {
    seasonId,
    gradedRaceIds: [...stripped.gradedRaceIds, raceId],
    individual: updatedIndividual,
    teams: updatedTeams,
  };

  await Promise.all([
    overwriteBlob(scoresPath(seasonId, raceId), raceScores),
    overwriteBlob(standingsPath(seasonId), newStandings),
  ]);

  return NextResponse.json({ ok: true });
}
