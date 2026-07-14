import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { PropKeyPersistenceSchema, RacePersistenceSchema, type RacePersistence } from "../../../server/repositories/race/schema.ts";
import { motorsportRacesPath } from "../../../lib/paths.ts";
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
} from "../shared/datafix-shared.ts";

// Datafix standard: this script touches motorsports/{motorsportId}/races.json (source-
// of-truth: the stored answer key fields on the race record — keyOrder/propKey/keySetAt)
// directly and only. It does NOT touch scores.json or standings.json for any league
// racing this motorsport, and it does NOT trigger regrading.
//
// BEHAVIOR CHANGE from the old script: the previous version ran this correction through
// SetRaceKeyCommand, which — as a side effect of setting the key — loaded every league on
// this motorsport and regraded them (recomputing and rewriting each league's
// predictions book scores and standings). That regrade is derived/computed data, out of
// scope for a datafix per the datafix standard, and has been dropped here, not
// reimplemented. This script now ONLY corrects the race's stored answer key. Recomputing
// downstream scores/standings for leagues affected by a key correction is a separate,
// out-of-scope concern that must be handled by a dedicated regrade mechanism (not yet
// built as a datafix-compliant tool as of this migration).
//
// Failure isolation: isolate-and-continue, per race correction. Each JSON file under
// ./data/corrected-race-keys targets an independent race; one bad/missing raceId or one
// invalid computed shape should not block correcting the other races in the same run
// (matches the pre-existing KNOWN_MISSING_SOURCE_DATA tolerance for partial data below).
const DATAFIX_ID = "apply-corrected-race-keys";

// Same bug as the corrected races below (keyOrder defaulted to startingGrid, propKey
// all-null), but no source Excel file exists yet to build a correction from. Drop a
// "<Title>.json" file into ./data/corrected-race-keys — same shape as the others — once
// the workbook is available, and it will be picked up automatically with no script change.
const KNOWN_MISSING_SOURCE_DATA = ["Bahrain", "Saudi Arabian"];

// 2026 season motorsport — every corrected race file in ./data/corrected-race-keys belongs
// to this motorsport today, and races.json is stored one array per motorsport (see
// lib/paths.ts#motorsportRacesPath). If a future correction spans a different motorsport,
// this needs to move into each JSON file rather than staying a single constant.
const MOTORSPORT_ID = "9ff98309-13ac-4dd6-85db-a9afba01179f";

// Derived from the relocated persistence schema (never the domain entity — see
// server/repositories/race/schema.ts) since this script only needs the structural
// shape for shape-checking, not any domain behavior.
type PropKey = z.infer<typeof PropKeyPersistenceSchema>;
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

function diffPropKey(current: PropKey | null | undefined, next: PropKey): string[] {
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
      return {
        raceId: raw.raceId,
        title: raw.title,
        keyOrder: raw.keyOrder,
        propKey: raw.propKey,
      } as CorrectedRaceKey;
    });
}

// Pure, in-memory transform: given the race's current persisted fields and the desired
// correction, returns the corrected record — or the SAME `race` reference, unchanged,
// when the grid and props already match (so deepEqual(before, after) is a true no-op,
// not a false "changed" from a bumped keySetAt on every re-run). keySetAt only advances
// when the key content itself actually changes, since it's part of the race's own
// source-of-truth state ("when was this key last set"), not a derived value.
function withCorrectedKey(race: RacePersistence, correction: CorrectedRaceKey, keySetAt: string): RacePersistence {
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

  // Imported dynamically, after env vars are loaded by the caller (either this file's
  // own CLI entry below, or run-prod-datafixes.ts) — lib/blob/index.ts constructs a
  // Supabase client at import time, so importing it statically (before env vars are
  // set) would lock in the wrong, or missing, credentials.
  const { blob } = await import("../../../lib/blob/index.ts");

  const path = motorsportRacesPath(MOTORSPORT_ID);
  const raw = await blob.read<unknown>(path);
  if (raw === null) {
    // No races.json for this motorsport at all — every correction targets a race that
    // can't exist yet. Report each as a failure rather than throwing, so the rest of a
    // combined run-prod-datafixes.ts pass still executes.
    for (const correction of loadCorrectedKeys()) {
      reporter.error(correction.title, new Error(`no races.json found for motorsport ${MOTORSPORT_ID}`));
    }
    return reporter.result();
  }

  const current = z.array(RacePersistenceSchema).parse(raw);
  let working = current;
  let changed = false;
  const now = new Date().toISOString();

  // Items computed as "would be applied" during the loop below, held back until the
  // batched write at the end actually succeeds — see the write block for why.
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
      RacePersistenceSchema.parse(after); // validate the computed target shape too

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
        reporter.plan(correction.title, before, after, detail);
        continue;
      }

      working = working.map((r) => (r.id === correction.raceId ? after : r));
      changed = true;
      // Not reported as applied yet — the shared write hasn't happened. Held in
      // pendingApplied until the write below actually succeeds (or reported as an
      // error instead, if it doesn't).
      pendingApplied.push({ label: correction.title, detail: `${detail} (no regrade triggered)` });
    } catch (e) {
      reporter.error(correction.title, e);
    }
  }

  if (shouldWrite && changed) {
    // Every item in pendingApplied was only computed in-memory above — none of it is
    // persisted until this write succeeds. Reporting reporter.applied() before this
    // point would print a misleading "applied" transcript for corrections that a
    // failed write never actually persisted. So: report applied only after the write
    // succeeds, and report error (not silence) for every pending item if it throws.
    try {
      await writeDatafixRevertSnapshot(blob, runId, path, current);
      await blob.write(path, working);
      for (const item of pendingApplied) {
        reporter.applied(item.label, item.detail);
      }
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
// Standalone CLI entry — only runs when this file is executed directly
// (`tsx scripts/datafix/apply-corrected-race-keys/apply-corrected-race-keys.ts`), not
// when imported by run-prod-datafixes.ts.
// ---------------------------------------------------------------------------

if (isMainModule(import.meta.url)) {
  const opts: DatafixOpts = parseDatafixArgs(process.argv.slice(2));
  loadDatafixEnv(opts.envFile);
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
