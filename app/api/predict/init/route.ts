import { NextResponse } from "next/server";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobRacerRepository } from "@/server/repositories/blob/BlobRacerRepository";
import { BlobRaceRepository } from "@/server/repositories/blob/BlobRaceRepository";
import { BlobRacePredictionBookRepository } from "@/server/repositories/blob/BlobRacePredictionBookRepository";

const leagueRepo = new BlobLeagueRepository();
const racerRepo = new BlobRacerRepository();
const raceRepo = new BlobRaceRepository();
const bookRepo = new BlobRacePredictionBookRepository();

const emptyPropKey = { driverOfDay: null, lapsLed: null, fastestPitStop: null, fastestLap: null, overAchiever: null, underAchiever: null, wrecker: null };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const leagues = await leagueRepo.findAll();
  const [racersList, racesPerLeague] = await Promise.all([
    racerRepo.findAll(),
    Promise.all(leagues.map(l => raceRepo.findAllForLeague(l.leagueId))),
  ]);
  const races = racesPerLeague.flat();

  const predictionEntries = await Promise.all(
    races.map(async (race) => {
      const book = await bookRepo.findByRace(race.leagueId, race.raceId);
      const data = book ? {
        key: book.keyOrder ? [...book.keyOrder] : null,
        keySetAt: book.keySetAt,
        predictions: Object.fromEntries(book.allPredictions().map(p => [p.userId, [...p.racerIds]])),
        submittedAt: Object.fromEntries(
          book.allPredictions().filter(p => p.submittedAt !== null).map(p => [p.userId, p.submittedAt!])
        ),
        propKey: book.propKey,
        propPicks: Object.fromEntries(book.allPredictions().map(p => [p.userId, { ...p.propPicks }])),
      } : { key: null, keySetAt: null, predictions: {}, propKey: emptyPropKey, propPicks: {} };
      return [race.raceId, data] as const;
    }),
  );

  return NextResponse.json({
    leagues: leagues.map(l => ({ id: l.leagueId, name: l.name, placementPoints: [...l.placementPoints], mulliganCount: l.mulliganCount, scoringDepth: l.scoringDepth, stageCount: l.stageCount, propPointValues: { ...l.propPointValues } })),
    racersById: Object.fromEntries(racersList.map(r => [r.racerId, { id: r.racerId, name: r.name, team: r.constructorName, image: r.image, teamColor: r.teamColor }])),
    races: races.map(r => ({ id: r.raceId, leagueId: r.leagueId, title: r.title, label: r.label, date: r.date, lockTime: r.lockTime, startingGrid: [...r.startingGrid] })),
    predictions: Object.fromEntries(predictionEntries),
  });
}
