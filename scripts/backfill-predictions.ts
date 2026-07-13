import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  type DatafixOpts,
  type DatafixStepResult,
  isMainModule,
  loadDatafixEnv,
  parseDatafixArgs,
  printDatafixBanner,
  printStepSummary,
} from "./datafix-shared.ts";

// Reformats the write phase of scripts/migration/ (extract.ts -> format-payloads.ts ->
// this) into the same dry-run/--yes/--env-file convention as the other datafix scripts.
// extract.ts and format-payloads.ts are unchanged — they're read-only/pure and already
// produced the payload files this script applies.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAYLOADS_DIR = path.join(__dirname, "migration", "output", "payloads");

// 2026 season motorsport — every payload file in ./migration/output/payloads belongs
// to this motorsport today, same as the other datafix scripts.
const MOTORSPORT_ID = "9ff98309-13ac-4dd6-85db-a9afba01179f";

interface Payload {
  leagueId: string;
  raceId: string;
  userId: string;
  racerIds: string[];
  propPicks?: Record<string, string>;
}

interface RacePayloads {
  title: string;
  raceId: string;
  leagueId: string;
  payloads: Payload[];
}

function loadAllPayloads(): RacePayloads[] {
  return readdirSync(PAYLOADS_DIR)
    .filter((f) => f.endsWith(".payloads.json"))
    .map((f) => {
      const title = f.replace(/\.payloads\.json$/, "");
      const raw = JSON.parse(readFileSync(path.join(PAYLOADS_DIR, f), "utf-8")) as Payload[];
      if (raw.length === 0) throw new Error(`${f}: empty payload file`);
      return { title, raceId: raw[0].raceId, leagueId: raw[0].leagueId, payloads: raw };
    });
}

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function propPicksEqual(a: Readonly<Partial<Record<string, string>>> | undefined, b: Record<string, string> | undefined): boolean {
  const ak = Object.keys(a ?? {}).sort();
  const bk = Object.keys(b ?? {}).sort();
  if (ak.length !== bk.length || ak.some((k, i) => k !== bk[i])) return false;
  return ak.every((k) => (a as Record<string, string>)[k] === (b as Record<string, string>)[k]);
}

export async function runBackfillPredictions(opts: { dryRun: boolean; confirmed: boolean }): Promise<DatafixStepResult> {
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
    { BlobRacerRepository },
    { RacePredictionBook },
    { RecalculateRaceCommand },
  ] = await Promise.all([
    import("../server/repositories/race/BlobRaceRepository.ts"),
    import("../server/repositories/league/BlobLeagueRepository.ts"),
    import("../server/repositories/team/BlobTeamRepository.ts"),
    import("../server/repositories/race-prediction-book/BlobRacePredictionBookRepository.ts"),
    import("../server/repositories/league-standings/BlobLeagueStandingsRepository.ts"),
    import("../server/repositories/racer/BlobRacerRepository.ts"),
    import("../server/domain/race-prediction-book.ts"),
    import("../server/commands/recalculate-race/RecalculateRaceCommand.ts"),
  ]);

  const raceRepo = new BlobRaceRepository();
  const leagueRepo = new BlobLeagueRepository();
  const teamRepo = new BlobTeamRepository();
  const bookRepo = new BlobRacePredictionBookRepository();
  const racerRepo = new BlobRacerRepository();
  const recalculateRaceCommand = new RecalculateRaceCommand(
    raceRepo,
    leagueRepo,
    bookRepo,
    new BlobLeagueStandingsRepository(),
    teamRepo,
  );

  const races = loadAllPayloads();
  console.log(`races found: ${races.map((r) => r.title).join(", ") || "(none)"}`);

  const racers = await racerRepo.findAll();
  const racerIdSet = new Set(racers.map((r) => r.racerId));

  let applied = 0;
  let skipped = 0;
  let pending = 0;
  let failed = 0;

  for (const r of races) {
    console.log(`\n${r.title} (${r.payloads.length} payload(s)):`);
    try {
      const race = await raceRepo.findById(MOTORSPORT_ID, r.raceId);
      if (!race) {
        console.error(`  FAIL: race ${r.raceId} not found under motorsport ${MOTORSPORT_ID}`);
        failed++;
        continue;
      }

      const league = await leagueRepo.findById(r.leagueId);
      if (!league) {
        console.error(`  FAIL: league ${r.leagueId} not found`);
        failed++;
        continue;
      }

      const teams = await teamRepo.findAllForLeague(r.leagueId);
      const memberIdSet = new Set([...(league.memberIds ?? []), ...teams.flatMap((t) => t.memberIds ?? [])]);

      let raceApplied = 0;

      for (const p of r.payloads) {
        const referencedRacerIds = [
          ...p.racerIds,
          ...Object.entries(p.propPicks ?? {}).filter(([k]) => k !== "fastestPitStop").map(([, v]) => v),
        ];
        const unresolved = referencedRacerIds.filter((id) => !racerIdSet.has(id));
        if (unresolved.length > 0) {
          console.error(`  FAIL: ${p.userId} — unresolved racerId(s): ${unresolved.join(", ")}`);
          failed++;
          continue;
        }
        if (!memberIdSet.has(p.userId)) {
          console.error(`  FAIL: ${p.userId} — not found in this league's team/league membership`);
          failed++;
          continue;
        }

        try {
          const book = await bookRepo.findByRace(r.leagueId, r.raceId);
          const existing = book?.predictionFor(p.userId);
          const alreadyMatches =
            existing !== undefined &&
            arraysEqual(existing.racerIds, p.racerIds) &&
            propPicksEqual(existing.propPicks, p.propPicks ?? {});

          if (alreadyMatches) {
            console.log(`  ok (no-op): ${p.userId} — already matches`);
            skipped++;
            continue;
          }

          if (!willWrite) {
            console.log(`  ${dryRun ? "would submit" : "planned"}: ${p.userId}${existing ? " (overwrite)" : " (new)"}`);
            console.log(JSON.stringify({ userId: p.userId, racerIds: p.racerIds, propPicks: p.propPicks ?? {} }, null, 2)
              .split("\n").map((l) => "    " + l).join("\n"));
            pending++;
            continue;
          }

          const activeBook = book ?? RacePredictionBook.empty(r.leagueId, r.raceId);
          activeBook.submitPrediction(p.userId, p.racerIds, p.propPicks ?? {}, new Date().toISOString(), null);
          await bookRepo.save(activeBook);
          console.log(`  applied: ${p.userId}${existing ? " (overwritten)" : " (submitted)"}`);
          applied++;
          raceApplied++;
        } catch (e) {
          console.error(`  FAIL: ${p.userId} —`, e);
          failed++;
        }
      }

      if (willWrite && raceApplied > 0) {
        console.log(`  regrading ${r.title} (all leagues on this motorsport)...`);
        await recalculateRaceCommand.execute({ motorsportId: MOTORSPORT_ID, raceId: r.raceId });
      }
    } catch (e) {
      console.error(`  FAIL: ${r.title} —`, e);
      failed++;
    }
  }

  return { applied, skipped, pending, failed };
}

// ---------------------------------------------------------------------------
// Standalone CLI entry — only runs when this file is executed directly
// (`tsx scripts/backfill-predictions.ts`), not when imported by run-prod-datafixes.ts.
// ---------------------------------------------------------------------------

if (isMainModule(import.meta.url)) {
  const opts: DatafixOpts = parseDatafixArgs(process.argv.slice(2));
  loadDatafixEnv(opts.envFile);
  printDatafixBanner(opts, [`payloads dir:     ${PAYLOADS_DIR}`]);

  runBackfillPredictions(opts).then((result) => {
    printStepSummary("backfill-predictions", result, opts);
    if (result.failed > 0) process.exitCode = 1;
  });
}
