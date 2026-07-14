import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
} from "./datafix-shared.ts";
import {
  PredictionsPersistenceSchema,
  type PredictionsPersistence,
} from "../../server/repositories/race-prediction-book/schema.ts";
import { RacePersistenceSchema } from "../../server/repositories/race/schema.ts";
import { LeaguePersistenceSchema } from "../../server/repositories/league/schema.ts";
import { TeamPersistenceSchema } from "../../server/repositories/team/schema.ts";
import { RacerPersistenceSchema } from "../../server/repositories/racer/schema.ts";
import {
  predictionsPath,
  motorsportRacesPath,
  LEAGUES_PATH,
  teamsPath,
  RACERS_PATH,
} from "../../lib/paths.ts";

// Reformats the write phase of scripts/migration/ (extract.ts -> format-payloads.ts ->
// this) into the same dry-run/--yes/--env-file convention as the other datafix scripts.
// extract.ts and format-payloads.ts are unchanged — they're read-only/pure and already
// produced the payload files this script applies. scripts/migration/ is a separate,
// unrelated pipeline and stays entirely out of scope for this migration.
//
// Datafix standard: this script writes ONLY predictions.json (source-of-truth: literally
// what a user submitted). It used to also call RecalculateRaceCommand.execute() after
// loading a race's payloads, which regrades that race for every league on the motorsport
// (recomputes scores.json/standings.json). That call has been REMOVED — recalculating
// derived/projected data is explicitly out of scope for a datafix per the datafix
// standard, and is not replicated here by hand. This is a real behavior change from the
// old script: running this datafix no longer leaves affected races freshly graded.
// Recalculation is a separate, out-of-scope concern — after all backfill datafixes have
// been applied, an operator must separately trigger regrading for every race this script
// touched (e.g. via whatever supported entrypoint calls RecalculateRaceCommand today).
//
// Write path: RacePredictionBook.submitPrediction() + BlobRacePredictionBookRepository.save()
// have been replaced with a pure, in-memory upsert (upsertPrediction below) over the
// predictions.json persistence shape directly, per the datafix standard (no repository/
// entity/service/command in the write path). upsertPrediction reproduces exactly what
// submitPrediction (server/domain/race-prediction-book.ts) + predictionsToPersistence
// (server/repositories/race-prediction-book/BlobRacePredictionBookRepository.ts) did
// together for a single user: submitPrediction always constructs a brand-new
// UserPrediction for that user (full replace of racerIds/propPicks, never merged with
// the old entry), and predictionsToPersistence always writes submittedAt = the instant
// of submission while OMITTING submittedBy for that user (the old script always called
// submitPrediction(..., new Date().toISOString(), null), and predictionsToPersistence
// filters out null submittedBy entries) — see upsertPrediction's comment for the exact
// mapping.
//
// Read path for resolving a payload's race, league, team-membership, and known-racer-id
// set: motorsports/{motorsportId}/races.json, leagues.json, and each league's
// teams.json/racers.json are read directly via blob.read and validated with their
// repositories' relocated persistence schemas (RacePersistenceSchema,
// LeaguePersistenceSchema, TeamPersistenceSchema, RacerPersistenceSchema) — no
// repository class is imported or constructed anywhere in this script. This replaces a
// previously-deferred exception (an earlier version of this script read these four
// blobs through their repositories, on the theory that a read-only lookup with "no
// source-of-truth blob of its own" was outside the datafix standard's reach). That
// reasoning doesn't hold: every one of these has a well-known blob path and a schema
// (relocated into a sibling schema.ts for league/team/racer, following the exact
// pattern already used by race/schema.ts and race-prediction-book/schema.ts), so
// reading them directly is no harder than for predictions.json itself. Only
// blob.read/blob.write against predictions.json performs writes.
//
// Failure isolation: isolate-and-continue at BOTH granularities. A whole race whose
// race/league lookup fails is skipped (that race's payloads are never attempted), but a
// single payload's validation/parse failure within an otherwise-healthy race only skips
// that payload — every other payload for that race, and every other race, still runs.
// This matches the old script's behavior (per-race and per-payload try/catch, neither
// level aborts the run) and is deliberate: a backfill run spans many independent
// users/races, and one bad payload/race should never block the rest from landing.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAYLOADS_DIR = path.join(__dirname, "..", "migration", "output", "payloads");

// 2026 season motorsport — every payload file in ./migration/output/payloads belongs
// to this motorsport today, same as the other datafix scripts.
const MOTORSPORT_ID = "9ff98309-13ac-4dd6-85db-a9afba01179f";

const DATAFIX_ID = "backfill-predictions";

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

const EMPTY_PREDICTIONS: PredictionsPersistence = {
  predictions: {},
  submittedAt: {},
  submittedBy: {},
  propPicks: {},
};

// Pure, in-memory upsert of one payload's prediction into the predictions.json
// persistence shape. Reproduces RacePredictionBook.submitPrediction() +
// BlobRacePredictionBookRepository's predictionsToPersistence() for a single user,
// without going through the entity/repository:
//   - predictions[userId] and propPicks[userId] are always fully replaced (submitPrediction
//     always constructs a brand-new UserPrediction for that user; nothing is merged with
//     whatever was there before)
//   - if the incoming racerIds/propPicks are IDENTICAL to what's already persisted for
//     this user, submittedAt/submittedBy for that user are left completely untouched —
//     this is what makes deepEqual(current, target) a true no-op detector, mirroring the
//     old script's explicit "already matches" skip (arraysEqual + propPicksEqual) that
//     avoided bumping submittedAt on a no-op resubmit
//   - otherwise submittedAt[userId] is set to `now` and submittedBy[userId] is deleted
//     entirely — the old script always called submitPrediction(..., new Date().toISOString(),
//     null), and predictionsToPersistence omits a user from submittedBy whenever their
//     submittedBy is null, rather than writing a null/empty value
function upsertPrediction(
  current: PredictionsPersistence,
  payload: Payload,
  now: string,
): PredictionsPersistence {
  const { userId, racerIds } = payload;
  const propPicks = payload.propPicks ?? {};

  const existingRacerIds = current.predictions[userId];
  const existingPropPicks = current.propPicks[userId];
  const dataUnchanged =
    existingRacerIds !== undefined &&
    arraysEqual(existingRacerIds, racerIds) &&
    propPicksEqual(existingPropPicks, propPicks);

  const nextSubmittedAt = { ...(current.submittedAt ?? {}) };
  const nextSubmittedBy = { ...(current.submittedBy ?? {}) };

  if (!dataUnchanged) {
    nextSubmittedAt[userId] = now;
    delete nextSubmittedBy[userId];
  }

  return {
    predictions: { ...current.predictions, [userId]: [...racerIds] },
    submittedAt: nextSubmittedAt,
    submittedBy: nextSubmittedBy,
    propPicks: { ...current.propPicks, [userId]: { ...propPicks } },
  };
}

export async function runBackfillPredictions(opts: { dryRun: boolean; confirmed: boolean }): Promise<DatafixStepResult> {
  const shouldWrite = willWrite(opts);
  const runId = generateDatafixRunId(DATAFIX_ID);
  const reporter = createDatafixReporter(opts);

  // Imported dynamically, after env vars are loaded by the caller (either this file's
  // own CLI entry below, or run-prod-datafixes.ts) — lib/blob/index.ts constructs a
  // Supabase client at import time, so importing it statically (before env vars are
  // set) would lock in the wrong, or missing, credentials.
  const { blob } = await import("../../lib/blob/index.ts");

  const races = loadAllPayloads();
  console.log(`races found: ${races.map((r) => r.title).join(", ") || "(none)"}`);

  // Racers, races (for this motorsport), and leagues are each read once, up front —
  // every payload in this run shares the same motorsport, and none of these three
  // blobs are mutated by this script, so one read per blob is equivalent to (and
  // cheaper than) re-resolving per race/payload.
  const racersRaw = await blob.read<unknown>(RACERS_PATH);
  const allRacers = racersRaw === null ? [] : z.array(RacerPersistenceSchema).parse(racersRaw);
  const racerIdSet = new Set(allRacers.map((racer) => racer.id));

  const racesRaw = await blob.read<unknown>(motorsportRacesPath(MOTORSPORT_ID));
  const allRaces = racesRaw === null ? [] : z.array(RacePersistenceSchema).parse(racesRaw);

  const leaguesRaw = await blob.read<unknown>(LEAGUES_PATH);
  const allLeagues = leaguesRaw === null ? [] : z.array(LeaguePersistenceSchema).parse(leaguesRaw);

  for (const r of races) {
    console.log(`\n${r.title} (${r.payloads.length} payload(s)):`);
    try {
      const race = allRaces.find((x) => x.id === r.raceId);
      if (!race) {
        reporter.error(r.title, new Error(`race ${r.raceId} not found under motorsport ${MOTORSPORT_ID}`));
        continue;
      }

      const league = allLeagues.find((x) => x.id === r.leagueId);
      if (!league) {
        reporter.error(r.title, new Error(`league ${r.leagueId} not found`));
        continue;
      }

      const teamsRaw = await blob.read<unknown>(teamsPath(r.leagueId));
      const teams = teamsRaw === null ? [] : z.array(TeamPersistenceSchema).parse(teamsRaw);
      const memberIdSet = new Set([...(league.memberIds ?? []), ...teams.flatMap((t) => t.memberIds ?? [])]);

      const dataPath = predictionsPath(r.leagueId, r.raceId);
      const raw = await blob.read<unknown>(dataPath);
      const current = raw === null ? EMPTY_PREDICTIONS : PredictionsPersistenceSchema.parse(raw);

      let target = current;

      // Payloads that computed a real change and would be written for this race.
      // reporter.applied() is deferred until AFTER the batched write below actually
      // succeeds — see that block's comment for why.
      const pendingApplied: { label: string; detail: string }[] = [];

      for (const p of r.payloads) {
        const label = `${r.title}: ${p.userId}`;
        try {
          const referencedRacerIds = [
            ...p.racerIds,
            ...Object.entries(p.propPicks ?? {}).filter(([k]) => k !== "fastestPitStop").map(([, v]) => v),
          ];
          const unresolved = referencedRacerIds.filter((id) => !racerIdSet.has(id));
          if (unresolved.length > 0) {
            reporter.error(label, new Error(`unresolved racerId(s): ${unresolved.join(", ")}`));
            continue;
          }
          if (!memberIdSet.has(p.userId)) {
            reporter.error(label, new Error("not found in this league's team/league membership"));
            continue;
          }

          const existed = target.predictions[p.userId] !== undefined;
          const now = new Date().toISOString();
          const candidate = upsertPrediction(target, p, now);
          PredictionsPersistenceSchema.parse(candidate); // validate the computed target shape too

          if (deepEqual(target, candidate)) {
            reporter.noop(label, "already matches");
            continue;
          }

          if (!shouldWrite) {
            reporter.plan(label, target, candidate, existed ? "overwrite" : "new");
            target = candidate;
            continue;
          }

          pendingApplied.push({ label, detail: existed ? "overwritten" : "submitted" });
          target = candidate;
        } catch (e) {
          reporter.error(label, e);
        }
      }

      if (deepEqual(current, target)) continue; // nothing changed for this race's predictions.json
      if (!shouldWrite) continue; // per-payload plan() output above already covers this

      // The write for this race's predictions.json happens exactly once, batching every
      // payload's upsert. reporter.applied() must only fire for payloads whose change
      // actually made it to storage — calling it earlier (inside the per-payload loop
      // above, before this write) would let a late write failure be caught below,
      // reporting BOTH applied (for payloads processed before the failure) AND an error
      // for the same data that was never persisted, even though nothing was actually
      // written. So every payload that computed a real change sits in pendingApplied
      // until the write below either succeeds (each is then reported applied) or fails
      // (each is reported as an error instead — not also reported at the race level,
      // which would double-count the same failure).
      try {
        await writeDatafixRevertSnapshot(blob, runId, dataPath, current);
        await blob.write(dataPath, target);
      } catch (e) {
        if (pendingApplied.length > 0) {
          for (const item of pendingApplied) reporter.error(item.label, e);
        } else {
          reporter.error(r.title, e);
        }
        continue;
      }

      for (const item of pendingApplied) reporter.applied(item.label, item.detail);
    } catch (e) {
      reporter.error(r.title, e);
    }
  }

  return reporter.result();
}

// ---------------------------------------------------------------------------
// Standalone CLI entry — only runs when this file is executed directly
// (`tsx scripts/datafix/backfill-predictions.ts`), not when imported by run-prod-datafixes.ts.
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
