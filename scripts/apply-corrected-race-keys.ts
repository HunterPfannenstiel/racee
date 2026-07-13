import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PropKey, PropName } from "../server/domain/race-prediction-book.ts";
import {
  type DatafixOpts,
  type DatafixStepResult,
  isMainModule,
  loadDatafixEnv,
  parseDatafixArgs,
  printDatafixBanner,
  printStepSummary,
} from "./datafix-shared.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data", "corrected-race-keys");

// Same bug as the corrected races below (keyOrder defaulted to startingGrid, propKey
// all-null), but no source Excel file exists yet to build a correction from. Drop a
// "<Title>.json" file into ./data/corrected-race-keys — same shape as the others — once
// the workbook is available, and it will be picked up automatically with no script change.
const KNOWN_MISSING_SOURCE_DATA = ["Bahrain", "Saudi Arabian"];

// 2026 season motorsport — every corrected race file in ./data/corrected-race-keys belongs
// to this motorsport today. If a future correction spans a different motorsport, this needs
// to move into each JSON file rather than staying a single constant.
const MOTORSPORT_ID = "9ff98309-13ac-4dd6-85db-a9afba01179f";

interface CorrectedRaceKey {
  raceId: string;
  title: string;
  keyOrder: string[];
  propKey: PropKey;
}

const PROP_NAMES: PropName[] = [
  "driverOfDay", "lapsLed", "fastestPitStop", "fastestLap",
  "overAchiever", "underAchiever", "wrecker",
];

function arraysEqual(a: readonly string[] | null, b: readonly string[] | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function propKeysEqual(a: PropKey | null, b: PropKey): boolean {
  if (a === null) return false;
  return PROP_NAMES.every((prop) => arraysEqual(a[prop], b[prop]));
}

function diffPropKey(current: PropKey | null, next: PropKey): string[] {
  return PROP_NAMES.filter((prop) => !arraysEqual(current?.[prop] ?? null, next[prop]));
}

function diffKeyOrder(current: readonly string[] | null, next: readonly string[]): number[] {
  if (current === null) return next.map((_, i) => i);
  const positions: number[] = [];
  const len = Math.max(current.length, next.length);
  for (let i = 0; i < len; i++) {
    if (current[i] !== next[i]) positions.push(i);
  }
  return positions;
}

function loadCorrectedKeys(): CorrectedRaceKey[] {
  return readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const raw = JSON.parse(readFileSync(path.join(DATA_DIR, f), "utf-8"));
      return {
        raceId: raw.raceId,
        title: raw.title,
        keyOrder: raw.keyOrder,
        propKey: raw.propKey,
      } as CorrectedRaceKey;
    });
}

export async function runApplyCorrectedRaceKeys(opts: { dryRun: boolean; confirmed: boolean }): Promise<DatafixStepResult> {
  const { dryRun, confirmed } = opts;
  const willWrite = !dryRun && confirmed;

  for (const title of KNOWN_MISSING_SOURCE_DATA) {
    console.log(`skip: ${title} — no corrected data yet (source Excel not available)`);
  }

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
    { SetRaceKeyCommand },
  ] = await Promise.all([
    import("../server/repositories/race/BlobRaceRepository.ts"),
    import("../server/repositories/league/BlobLeagueRepository.ts"),
    import("../server/repositories/team/BlobTeamRepository.ts"),
    import("../server/repositories/race-prediction-book/BlobRacePredictionBookRepository.ts"),
    import("../server/repositories/league-standings/BlobLeagueStandingsRepository.ts"),
    import("../server/commands/set-race-key/SetRaceKeyCommand.ts"),
  ]);

  const raceRepo = new BlobRaceRepository();
  const setRaceKeyCommand = new SetRaceKeyCommand(
    raceRepo,
    new BlobLeagueRepository(),
    new BlobRacePredictionBookRepository(),
    new BlobLeagueStandingsRepository(),
    new BlobTeamRepository(),
  );

  const corrections = loadCorrectedKeys();
  let applied = 0;
  let skipped = 0;
  let pending = 0;
  let failed = 0;

  for (const correction of corrections) {
    try {
      const race = await raceRepo.findById(MOTORSPORT_ID, correction.raceId);
      if (!race) {
        console.error(`FAIL: ${correction.title} — race ${correction.raceId} not found under motorsport ${MOTORSPORT_ID}`);
        failed++;
        continue;
      }

      const gridChanged = !arraysEqual(race.keyOrder, correction.keyOrder);
      const propsChanged = !propKeysEqual(race.propKey, correction.propKey);

      if (!gridChanged && !propsChanged) {
        console.log(`ok (no-op): ${correction.title} — already matches corrected key`);
        skipped++;
        continue;
      }

      const changedFields = [
        ...(gridChanged ? [`grid (${diffKeyOrder(race.keyOrder, correction.keyOrder).length} position(s))`] : []),
        ...(propsChanged ? [`props (${diffPropKey(race.propKey, correction.propKey).join(", ")})`] : []),
      ];

      if (!willWrite) {
        console.log(`${dryRun ? "would update" : "planned"}: ${correction.title} — ${changedFields.join("; ")}`);
        console.log(JSON.stringify({ keyOrder: correction.keyOrder, propKey: correction.propKey }, null, 2)
          .split("\n").map((l) => "  " + l).join("\n"));
        pending++;
        continue;
      }

      await setRaceKeyCommand.execute({
        motorsportId: MOTORSPORT_ID,
        raceId: correction.raceId,
        racerIds: correction.keyOrder,
        propKey: correction.propKey,
      });
      console.log(`applied: ${correction.title} — ${changedFields.join("; ")} (all leagues on this motorsport regraded)`);
      applied++;
    } catch (e) {
      console.error(`FAIL: ${correction.title} —`, e);
      failed++;
    }
  }

  return { applied, skipped, pending, failed };
}

// ---------------------------------------------------------------------------
// Standalone CLI entry — only runs when this file is executed directly
// (`tsx scripts/apply-corrected-race-keys.ts`), not when imported by
// run-prod-datafixes.ts.
// ---------------------------------------------------------------------------

if (isMainModule(import.meta.url)) {
  const opts: DatafixOpts = parseDatafixArgs(process.argv.slice(2));
  loadDatafixEnv(opts.envFile);
  printDatafixBanner(opts);

  runApplyCorrectedRaceKeys(opts).then((result) => {
    printStepSummary("apply-corrected-race-keys", result, opts);
    if (result.failed > 0) process.exitCode = 1;
  });
}
