import { z } from "zod";
import {
  type DatafixOpts,
  type DatafixStepResult,
  createDatafixReporter,
  deepEqual,
  generateDatafixRunId,
  isMainModule,
  loadDatafixEnv,
  parseDatafixArgs,
  printDatafixBanner,
  printStepSummary,
  willWrite,
  writeDatafixRevertSnapshot,
} from "./shared/datafix-shared.ts";
import {
  PredictionsPersistenceSchema,
  type PredictionsPersistence,
} from "../../server/repositories/race-prediction-book/schema.ts";
import { RacePersistenceSchema } from "../../server/repositories/race/schema.ts";
import { predictionsPath, motorsportRacesPath } from "../../lib/paths.ts";

// "Dan 1 " (trailing space in the auth record) — mrhockeyforlife510@gmail.com. An
// unwanted duplicate account with no formal league/team membership, but with
// prediction data in TEST LEAGUE from an admin backfill. Auth tables (User/Session/
// Account) are explicitly out of scope — only the league-scoped predictions.json data
// gets touched. Confirmed identical scope on prod (same league id, same three races).
//
// Datafix standard: this script touches predictions.json (source-of-truth: literally
// what a user submitted) directly and only. It does NOT touch scores.json or
// standings.json — those are derived/computed projections of grading business logic,
// not just data shape, and re-deriving them correctly is explicitly out of scope for a
// datafix. Any downstream recalculation those blobs need is a separate concern, handled
// by a separate mechanism.
const DATAFIX_ID = "remove-dan1-test-league-data";
const TARGET_USER_ID = "fNPil60PrdkKQOjZwMmG7XoDHNOqIJXH";
const TARGET_LEAGUE_ID = "1c527405-c475-4e55-ace6-5ec7a53d1b3b"; // TEST!! USE THIS LEAGUE
const MOTORSPORT_ID = "9ff98309-13ac-4dd6-85db-a9afba01179f";
const TARGET_RACE_TITLES = ["Austria", "Great Britain", "Barcelona"];

// Removes TARGET_USER_ID's entries from every user-keyed map in a predictions.json
// payload. Pure function over the persistence shape — no I/O, no domain objects.
function removeUserFromPredictions(
  current: PredictionsPersistence,
  userId: string,
): PredictionsPersistence {
  const omit = <V>(record: Record<string, V>): Record<string, V> =>
    Object.fromEntries(Object.entries(record).filter(([key]) => key !== userId));

  return {
    predictions: omit(current.predictions),
    submittedAt: current.submittedAt ? omit(current.submittedAt) : current.submittedAt,
    submittedBy: current.submittedBy ? omit(current.submittedBy) : current.submittedBy,
    propPicks: omit(current.propPicks),
  };
}

export async function runRemoveDan1Data(opts: { dryRun: boolean; confirmed: boolean }): Promise<DatafixStepResult> {
  const shouldWrite = willWrite(opts);
  const runId = generateDatafixRunId(DATAFIX_ID);
  const reporter = createDatafixReporter(opts);

  // Imported dynamically, after env vars are loaded by the caller (either this file's
  // own CLI entry below, or run-prod-datafixes.ts) — lib/blob/index.ts constructs a
  // Supabase client at import time, so importing it statically (before env vars are
  // set) would lock in the wrong, or missing, credentials.
  const { blob } = await import("../../lib/blob/index.ts");

  // Resolves race titles to race IDs via a direct read of
  // motorsports/{motorsportId}/races.json (same blob/path as apply-corrected-race-keys.ts),
  // validated by RacePersistenceSchema — no repository in the read path, per the
  // datafix standard.
  const racesRaw = await blob.read<unknown>(motorsportRacesPath(MOTORSPORT_ID));
  const allRaces = racesRaw === null ? [] : z.array(RacePersistenceSchema).parse(racesRaw);
  const targetRaces = TARGET_RACE_TITLES.map((title) => {
    const race = allRaces.find((r) => r.title === title);
    if (!race) throw new Error(`race titled "${title}" not found under motorsport ${MOTORSPORT_ID}`);
    return race;
  });

  for (const race of targetRaces) {
    const path = predictionsPath(TARGET_LEAGUE_ID, race.id);
    try {
      const raw = await blob.read<unknown>(path);
      if (raw === null) {
        reporter.noop(race.title, "no predictions.json for this league/race");
        continue;
      }

      const current = PredictionsPersistenceSchema.parse(raw);
      const target = removeUserFromPredictions(current, TARGET_USER_ID);
      PredictionsPersistenceSchema.parse(target); // validate the computed target shape too

      if (deepEqual(current, target)) {
        reporter.noop(race.title, "no data for target user");
        continue;
      }

      if (!shouldWrite) {
        reporter.plan(race.title, current, target);
        continue;
      }

      await writeDatafixRevertSnapshot(blob, runId, path, current);
      await blob.write(path, target);
      reporter.applied(race.title, "removed target user's prediction data");
    } catch (e) {
      reporter.error(race.title, e);
    }
  }

  return reporter.result();
}

// ---------------------------------------------------------------------------
// Standalone CLI entry — only runs when this file is executed directly
// (`tsx scripts/datafix/remove-dan1-test-league-data.ts`), not when imported by
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
