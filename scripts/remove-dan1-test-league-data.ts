import {
  type DatafixOpts,
  type DatafixStepResult,
  isMainModule,
  loadDatafixEnv,
  parseDatafixArgs,
  printDatafixBanner,
  printStepSummary,
} from "./datafix-shared.ts";

// "Dan 1 " (trailing space in the auth record) — mrhockeyforlife510@gmail.com. An
// unwanted duplicate account with no formal league/team membership, but with
// prediction + score data in TEST LEAGUE from an admin backfill. Auth tables
// (User/Session/Account) are explicitly out of scope — only the league-scoped
// blob data that earns him points gets removed. Confirmed identical scope on prod
// (same league id, same three races).
const TARGET_USER_ID = "fNPil60PrdkKQOjZwMmG7XoDHNOqIJXH";
const TARGET_LEAGUE_ID = "1c527405-c475-4e55-ace6-5ec7a53d1b3b"; // TEST!! USE THIS LEAGUE
const MOTORSPORT_ID = "9ff98309-13ac-4dd6-85db-a9afba01179f";
const TARGET_RACE_TITLES = ["Austria", "Great Britain", "Barcelona"];

export async function runRemoveDan1Data(opts: { dryRun: boolean; confirmed: boolean }): Promise<DatafixStepResult> {
  const { dryRun, confirmed } = opts;
  const willWrite = !dryRun && confirmed;

  // Imported dynamically, after env vars are loaded by the caller (either this file's
  // own CLI entry below, or run-prod-datafixes.ts) — these modules construct a Supabase
  // client at import time (lib/blob/supabase.ts), so importing them statically (before
  // env vars are set) would lock in the wrong, or missing, credentials.
  const [
    { BlobRaceRepository },
    { BlobLeagueRepository },
    { BlobTeamRepository },
    { BlobRacePredictionBookRepository },
    { BlobLeagueStandingsRepository },
    { LeagueStandings },
    { gradeLeagueRace },
  ] = await Promise.all([
    import("../server/repositories/race/BlobRaceRepository.ts"),
    import("../server/repositories/league/BlobLeagueRepository.ts"),
    import("../server/repositories/team/BlobTeamRepository.ts"),
    import("../server/repositories/race-prediction-book/BlobRacePredictionBookRepository.ts"),
    import("../server/repositories/league-standings/BlobLeagueStandingsRepository.ts"),
    import("../server/domain/league-standings.ts"),
    import("../server/services/grading.ts"),
  ]);

  const raceRepo = new BlobRaceRepository();
  const leagueRepo = new BlobLeagueRepository();
  const teamRepo = new BlobTeamRepository();
  const bookRepo = new BlobRacePredictionBookRepository();
  const standingsRepo = new BlobLeagueStandingsRepository();

  const league = await leagueRepo.findById(TARGET_LEAGUE_ID);
  if (!league) {
    console.error(`FAIL: league ${TARGET_LEAGUE_ID} not found`);
    return { applied: 0, skipped: 0, pending: 0, failed: 1 };
  }

  const allRaces = await raceRepo.findAllForMotorsport(MOTORSPORT_ID);
  const targetRaces = TARGET_RACE_TITLES.map((title) => {
    const race = allRaces.find((r) => r.title === title);
    if (!race) throw new Error(`race titled "${title}" not found under motorsport ${MOTORSPORT_ID}`);
    return race;
  });

  const teams = await teamRepo.findAllForLeague(TARGET_LEAGUE_ID);
  const standings = (await standingsRepo.findByLeague(TARGET_LEAGUE_ID)) ?? LeagueStandings.empty(TARGET_LEAGUE_ID);

  let applied = 0;
  let skipped = 0;
  let pending = 0;
  let failed = 0;
  let standingsTouched = false;

  for (const race of targetRaces) {
    try {
      const book = await bookRepo.findByRace(TARGET_LEAGUE_ID, race.raceId);
      if (!book) {
        console.log(`ok (no-op): ${race.title} — no prediction book for this league/race`);
        skipped++;
        continue;
      }

      const hadPrediction = book.predictionFor(TARGET_USER_ID) !== undefined;
      const hadScoreEntry = book.scores?.entryFor(TARGET_USER_ID) !== undefined;

      if (!hadPrediction && !hadScoreEntry) {
        console.log(`ok (no-op): ${race.title} — no data for target user`);
        skipped++;
        continue;
      }

      const parts = [
        ...(hadPrediction ? ["prediction"] : []),
        ...(hadScoreEntry ? ["score entry"] : []),
      ];

      if (!willWrite) {
        console.log(`${dryRun ? "would remove" : "planned"}: ${race.title} — ${parts.join(" + ")}`);
        if (hadPrediction) {
          const pred = book.predictionFor(TARGET_USER_ID)!;
          console.log(JSON.stringify({ userId: TARGET_USER_ID, racerIds: pred.racerIds, propPicks: pred.propPicks }, null, 2)
            .split("\n").map((l) => "  " + l).join("\n"));
        }
        pending++;
        continue;
      }

      book.retractPrediction(TARGET_USER_ID);
      gradeLeagueRace(league, race, book, standings, teams);
      await bookRepo.save(book);
      standingsTouched = true;

      console.log(`applied: ${race.title} — removed ${parts.join(" + ")}, race regraded`);
      applied++;
    } catch (e) {
      console.error(`FAIL: ${race.title} —`, e);
      failed++;
    }
  }

  const hasStandingsEntry = standings.individual.some((u) => u.userId === TARGET_USER_ID);
  if (hasStandingsEntry) {
    if (!willWrite) {
      console.log(`${dryRun ? "would remove" : "planned"}: standings — individual entry for target user`);
      pending++;
    } else {
      standings.removeIndividual(TARGET_USER_ID);
      standingsTouched = true;
      console.log("applied: standings — removed individual entry for target user");
      applied++;
    }
  } else if (willWrite || dryRun) {
    console.log("ok (no-op): standings — no individual entry for target user");
    skipped++;
  }

  if (willWrite && standingsTouched) {
    await standingsRepo.save(standings);
  }

  return { applied, skipped, pending, failed };
}

// ---------------------------------------------------------------------------
// Standalone CLI entry — only runs when this file is executed directly
// (`tsx scripts/remove-dan1-test-league-data.ts`), not when imported by
// run-prod-datafixes.ts.
// ---------------------------------------------------------------------------

if (isMainModule(import.meta.url)) {
  const opts: DatafixOpts = parseDatafixArgs(process.argv.slice(2));
  loadDatafixEnv(opts.envFile);
  printDatafixBanner(opts, [
    `target league:    ${TARGET_LEAGUE_ID} (TEST!! USE THIS LEAGUE)`,
    `target user:      ${TARGET_USER_ID} ("Dan 1 ")`,
    `target races:     ${TARGET_RACE_TITLES.join(", ")}`,
  ]);

  runRemoveDan1Data(opts).then((result) => {
    printStepSummary("remove-dan1-test-league-data", result, opts);
    if (result.failed > 0) process.exitCode = 1;
  });
}
