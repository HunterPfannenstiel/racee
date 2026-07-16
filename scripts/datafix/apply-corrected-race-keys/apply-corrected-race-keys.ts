import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { motorsportRacesPath } from "@/lib/paths";
import { RaceSchema, RacesFileSchema, PropKeySchema, type Race, type PropKey } from "@/lib/schemas";
import {
  type DatafixOpts,
  type DatafixStepResult,
  createDatafixReporter,
  deepEqual,
  generateDatafixRunId,
  isMainModule,
  parseDatafixArgs,
  printDatafixBanner,
  printStepSummary,
  willWrite,
  writeDatafixRevertSnapshot,
} from "../shared/datafix-shared.ts";

// This branch exists only to carry this one script (per scripts/datafix/AGENTS.md's
// Delete On Merge lifecycle) — it isn't meant to be merged into main.
//
// Scope: this script only corrects the stored answer key
// (motorsports/{motorsportId}/races.json — keyOrder/propKey/keySetAt) for the races
// listed under ./data/corrected-race-keys. It does NOT regrade — main's only existing
// path to set a key (PredictionService.setAnswerKey) always regrades every league on
// the motorsport as an inseparable side effect, which is out of scope for a one-off key
// correction. This script bypasses that service and writes races.json directly instead.
// After a real run, regrade each corrected race separately via the existing
// POST /api/races/{raceId}/recalculate endpoint.
const DATAFIX_ID = "apply-corrected-race-keys";

// Same bug as the corrected races below (keyOrder defaulted to startingGrid, propKey
// all-null), but no source Excel file exists yet to build a correction from. Drop a
// "<Title>.json" file into ./data/corrected-race-keys — same shape as the others — once
// the workbook is available, and it will be picked up automatically with no script change.
const KNOWN_MISSING_SOURCE_DATA = ["Bahrain", "Saudi Arabian"];

// 2026 season motorsport — every corrected race file in ./data/corrected-race-keys belongs
// to this motorsport today, and races.json is stored one array per motorsport (see
// lib/paths.ts#motorsportRacesPath).
const MOTORSPORT_ID = "9ff98309-13ac-4dd6-85db-a9afba01179f";

type PropName = keyof PropKey;

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

function arraysEqual(a: readonly string[] | null | undefined, b: readonly string[] | null | undefined): boolean {
  if (a == null || b == null) return a == null && b == null;
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function propKeysEqual(a: PropKey | null | undefined, b: PropKey): boolean {
  if (a == null) return false;
  return PROP_NAMES.every((prop) => arraysEqual(a[prop], b[prop]));
}

function diffPropKey(current: PropKey | null | undefined, next: PropKey): PropName[] {
  return PROP_NAMES.filter((prop) => !arraysEqual(current?.[prop], next[prop]));
}

function diffKeyOrder(current: readonly string[] | null | undefined, next: readonly string[]): number[] {
  if (current == null) return next.map((_, i) => i);
  const positions: number[] = [];
  const len = Math.max(current.length, next.length);
  for (let i = 0; i < len; i++) {
    if (current[i] !== next[i]) positions.push(i);
  }
  return positions;
}

function loadCorrectedKeys(): CorrectedRaceKey[] {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dataDir = path.join(__dirname, "data", "corrected-race-keys");
  return readdirSync(dataDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const raw = JSON.parse(readFileSync(path.join(dataDir, f), "utf-8"));
      const propKey = PropKeySchema.parse(raw.propKey);
      return {
        raceId: raw.raceId as string,
        title: raw.title as string,
        keyOrder: raw.keyOrder as string[],
        propKey,
      };
    });
}

// Pure, in-memory transform: returns the corrected record, or the SAME `race`
// reference when the grid and props already match — so deepEqual(before, after) is a
// true no-op, not a false "changed" from a bumped keySetAt on every re-run. keySetAt
// only advances when the key content itself actually changes.
function withCorrectedKey(race: Race, correction: CorrectedRaceKey, keySetAt: string): Race {
  const gridChanged = !arraysEqual(race.keyOrder, correction.keyOrder);
  const propsChanged = !propKeysEqual(race.propKey, correction.propKey);
  if (!gridChanged && !propsChanged) return race;
  return { ...race, keyOrder: correction.keyOrder, propKey: correction.propKey, keySetAt };
}

export async function runApplyCorrectedRaceKeys(opts: { dryRun: boolean; confirmed: boolean }): Promise<DatafixStepResult> {
  const shouldWrite = willWrite(opts);
  const runId = generateDatafixRunId(DATAFIX_ID);
  const reporter = createDatafixReporter(opts);

  for (const title of KNOWN_MISSING_SOURCE_DATA) {
    console.log(`skip: ${title} — no corrected data yet (source Excel not available)`);
  }

  // Imported dynamically rather than at module top level: lib/blob/supabase.ts
  // constructs its Supabase client unconditionally at module-evaluation time (even
  // when SUPABASE_URL is unset and LocalBlobStore is what actually gets used), so a
  // static top-level import here would crash on that before parseDatafixArgs/
  // printDatafixBanner above ever get a chance to report a bad flag.
  const { blob } = await import("@/lib/blob");

  const racesBlobPath = motorsportRacesPath(MOTORSPORT_ID);
  const raw = await blob.read<unknown>(racesBlobPath);
  if (raw === null) {
    // No races.json for this motorsport at all — every correction targets a race that
    // can't exist yet. Report each as a failure rather than throwing, so the rest of a
    // multi-script run still executes.
    for (const correction of loadCorrectedKeys()) {
      reporter.error(correction.title, new Error(`no races.json found for motorsport ${MOTORSPORT_ID}`));
    }
    return reporter.result();
  }

  const current = RacesFileSchema.parse(raw);
  let working = current;
  let changed = false;
  const now = new Date().toISOString();

  // Items computed as "would be applied" during the loop below, held back until the
  // batched write at the end actually succeeds — reporter.applied() must only fire for
  // corrections that actually made it to storage.
  const pendingApplied: { label: string; detail: string }[] = [];

  const corrections = loadCorrectedKeys();

  for (const correction of corrections) {
    try {
      const before = working.find((r) => r.id === correction.raceId);
      if (!before) {
        reporter.error(correction.title, new Error(`race ${correction.raceId} not found under motorsport ${MOTORSPORT_ID} in races.json`));
        continue;
      }

      const after = withCorrectedKey(before, correction, now);
      RaceSchema.parse(after); // validate the computed target shape too

      if (deepEqual(before, after)) {
        reporter.noop(correction.title, "already matches corrected key");
        continue;
      }

      const changedFields = [
        ...(!arraysEqual(before.keyOrder, correction.keyOrder)
          ? [`grid (${diffKeyOrder(before.keyOrder, correction.keyOrder).length} position(s))`]
          : []),
        ...(!propKeysEqual(before.propKey, correction.propKey)
          ? [`props (${diffPropKey(before.propKey, correction.propKey).join(", ")})`]
          : []),
      ];
      const detail = changedFields.join("; ");

      if (!shouldWrite) {
        // Etiquette: never dump the entire before/after race record (full keyOrder /
        // startingGrid arrays) to the console — `detail` already says exactly what's
        // changing, so the preview stays compact instead of a wall of UUIDs.
        reporter.plan(correction.title, "current key", `corrected key (./data/corrected-race-keys/${correction.title}.json)`, detail);
        continue;
      }

      working = working.map((r) => (r.id === correction.raceId ? after : r));
      changed = true;
      pendingApplied.push({
        label: correction.title,
        detail: `${detail} (key only — regrade separately via POST /api/races/${correction.raceId}/recalculate)`,
      });
    } catch (e) {
      reporter.error(correction.title, e);
    }
  }

  if (shouldWrite && changed) {
    // Nothing above is persisted until this write succeeds — reporter.applied() is
    // deferred until then, and every pending item is reported as an error instead if
    // the write fails, rather than silently dropped.
    try {
      await writeDatafixRevertSnapshot(blob, runId, racesBlobPath, current);
      await blob.write(racesBlobPath, working);
      for (const item of pendingApplied) reporter.applied(item.label, item.detail);
    } catch (e) {
      const writeError = e instanceof Error ? e : new Error(String(e));
      for (const item of pendingApplied) {
        reporter.error(item.label, new Error(`batched write failed: ${writeError.message}`, { cause: writeError }));
      }
    }
  }

  return reporter.result();
}

// ---------------------------------------------------------------------------
// Standalone CLI entry — run via:
//   npx tsx scripts/datafix/apply-corrected-race-keys/apply-corrected-race-keys.ts --dry-run
//   npx tsx scripts/datafix/apply-corrected-race-keys/apply-corrected-race-keys.ts --yes
// (or via the "Data Fix Runner" GitHub Actions workflow, script_path =
// apply-corrected-race-keys/apply-corrected-race-keys.ts)
// ---------------------------------------------------------------------------

if (isMainModule(import.meta.url)) {
  const opts: DatafixOpts = parseDatafixArgs(process.argv.slice(2));
  printDatafixBanner(opts, [`target motorsport: ${MOTORSPORT_ID}`]);

  runApplyCorrectedRaceKeys(opts)
    .then((result) => {
      printStepSummary("apply-corrected-race-keys", result, opts);
      if (result.failed > 0) process.exitCode = 1;
    })
    .catch((e) => {
      console.error("apply-corrected-race-keys: unhandled error", e);
      process.exitCode = 1;
    });
}
