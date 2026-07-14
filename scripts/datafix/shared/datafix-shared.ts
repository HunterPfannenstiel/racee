import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import type { BlobStore } from "@/lib/blob/interface";

// Shared by every prod-datafix script (apply-corrected-race-keys, backfill-predictions,
// remove-dan1-test-league-data, run-prod-datafixes) so the CLI conventions — env
// loading, --dry-run/--yes/--env-file parsing, banner, per-step summary — stay
// identical across all of them instead of being hand-copied per file.

export interface DatafixOpts {
  dryRun: boolean;
  confirmed: boolean;
  envFile: string;
}

export interface DatafixStepResult {
  applied: number;
  skipped: number;
  pending: number;
  failed: number;
}

export function emptyStepResult(): DatafixStepResult {
  return { applied: 0, skipped: 0, pending: 0, failed: 0 };
}

export function mergeStepResults(a: DatafixStepResult, b: DatafixStepResult): DatafixStepResult {
  return {
    applied: a.applied + b.applied,
    skipped: a.skipped + b.skipped,
    pending: a.pending + b.pending,
    failed: a.failed + b.failed,
  };
}

const VALID_DATAFIX_FLAGS = "--dry-run, --yes, --env-file=<value>";

// Every argv entry must be exactly one of --dry-run, --yes, or --env-file=<value>
// (the `=` form specifically — a bare --env-file with no value is also rejected
// rather than silently falling back to the default envFile). Anything else throws
// instead of being silently dropped: a typo'd flag (e.g. "-dry-run") combined with
// --yes must never be mistaken by the operator for a safe preview when it's actually
// about to perform a real write.
export function parseDatafixArgs(argv: string[]): DatafixOpts {
  const unrecognized = argv.filter(
    (a) => a !== "--dry-run" && a !== "--yes" && !/^--env-file=.+$/.test(a),
  );
  if (unrecognized.length > 0) {
    throw new Error(
      `unrecognized datafix argument(s): ${unrecognized.join(", ")} — valid flags are: ${VALID_DATAFIX_FLAGS}`,
    );
  }

  const dryRun = argv.includes("--dry-run");
  const confirmed = argv.includes("--yes");
  const envFileArg = argv.find((a) => a.startsWith("--env-file="));
  const envFile = envFileArg ? envFileArg.slice("--env-file=".length) : ".env.local";
  return { dryRun, confirmed, envFile };
}

// Single source of truth for the three-way write-mode precedence every datafix
// script/banner/summary needs: dry-run always wins over --yes (so a script can never
// be tricked into writing just because --yes was also passed), otherwise --yes means
// a confirmed real write, otherwise it's preview-only. Everything that needs to know
// or display the current mode should call this (or willWrite below) instead of
// re-deriving the same `dryRun ? ... : confirmed ? ... : ...` logic independently.
export type DatafixMode = "dry-run" | "preview" | "write";

export function resolveDatafixMode(opts: Pick<DatafixOpts, "dryRun" | "confirmed">): DatafixMode {
  if (opts.dryRun) return "dry-run";
  if (opts.confirmed) return "write";
  return "preview";
}

// Convenience predicate for the common case ("should this step actually write?"),
// built on resolveDatafixMode so it can't drift out of sync with the mode logic.
export function willWrite(opts: Pick<DatafixOpts, "dryRun" | "confirmed">): boolean {
  return resolveDatafixMode(opts) === "write";
}

// Must be called before any import that touches lib/blob (e.g. the repository modules
// dynamically imported inside each step's run function) — lib/blob/supabase.ts
// constructs its Supabase client at module-evaluation time, so loading env vars after
// that module is imported is too late. Safe to call more than once in the same
// process (e.g. once from run-prod-datafixes.ts, once from a step's own CLI entry) —
// dotenv does not override already-set env vars by default.
export function loadDatafixEnv(envFile: string): void {
  const result = config({ path: envFile });
  if (result.error) {
    console.warn(`warning: could not load ${envFile} (${result.error.message}) — relying on already-exported env vars`);
  }
}

export function printDatafixBanner(opts: DatafixOpts, extraLines: string[] = []): void {
  const { envFile } = opts;
  const mode = resolveDatafixMode(opts);
  const backend = process.env.VERCEL ? "SupabaseBlobStore" : "LocalBlobStore";
  console.log("=".repeat(60));
  console.log(`target env file:  ${envFile}`);
  console.log(
    `storage backend:  ${backend}` +
      (process.env.VERCEL ? "" : "  (writes to .blob-store/ on local disk, NOT Supabase — set VERCEL=1 to target Supabase)"),
  );
  if (process.env.VERCEL) {
    console.log(`SUPABASE_URL:     ${process.env.SUPABASE_URL ?? "(not set)"}`);
    console.log(`DATABASE_SCHEMA:  ${process.env.DATABASE_SCHEMA ?? "(not set)"}`);
    console.log(`BUCKET_NAME:      ${process.env.BUCKET_NAME ?? "(not set)"}`);
  }
  for (const line of extraLines) console.log(line);
  console.log(
    `mode:             ${mode === "dry-run" ? "dry-run (no writes)" : mode === "write" ? "REAL WRITE (--yes)" : "preview only (pass --yes to write)"}`,
  );
  console.log("=".repeat(60));
}

export function printStepSummary(label: string, result: DatafixStepResult, opts: DatafixOpts): void {
  const { envFile } = opts;
  const mode = resolveDatafixMode(opts);
  if (mode === "dry-run") {
    console.log(`\n[${label}] dry run done — ${result.pending} change(s) would apply, ${result.skipped} already clean`);
  } else if (mode === "preview") {
    console.log(`\n[${label}] preview only — ${result.pending} change(s) pending, ${result.skipped} already clean. Re-run with --yes to apply against ${envFile}.`);
  } else {
    console.log(`\n[${label}] done — ${result.applied} applied, ${result.skipped} already clean, ${result.failed} failed`);
  }
}

// True when this module was invoked directly (`tsx scripts/foo.ts`) rather than
// imported by another script (e.g. run-prod-datafixes.ts) — gates each script's
// standalone CLI entry so importing it as a library doesn't also run its main().
export function isMainModule(moduleUrl: string): boolean {
  return process.argv[1] === fileURLToPath(moduleUrl);
}

// ---------------------------------------------------------------------------
// Direct-blob-manipulation toolkit
// ---------------------------------------------------------------------------
//
// Support for the datafix standard: touch source-of-truth blobs directly
// (raw read -> validate shape -> mutate in-memory -> validate shape -> diff ->
// dry-run or write), bypassing repositories/domain/services/commands for the
// write path entirely. Nothing here is specific to any one blob — every
// script following the standard reads its own blob(s) and computes its own
// before/after, then hands them to these helpers for comparison, reporting,
// and safe writing.

// Structural, order-independent deep equality over plain JSON-shaped values
// (the output of blob.read / a zod .parse()). No existing deep-equality
// utility was found elsewhere in the codebase (the other datafix scripts'
// idempotency checks — e.g. backfill-predictions.ts's arraysEqual/propPicksEqual
// — are hand-rolled per-shape comparisons, not a general utility), so this is
// the first shared one. Deliberately not JSON.stringify(a) === JSON.stringify(b):
// that's sensitive to object key order, which zod-parsed / Object.fromEntries-built
// objects don't reliably preserve across a before/after pair.
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  }
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj).sort();
  const bKeys = Object.keys(bObj).sort();
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k, i) => k === bKeys[i] && deepEqual(aObj[k], bObj[k]));
}

// Prints the exact before/after JSON for one planned change — the dry-run/preview
// convention every datafix script follows (exact JSON a reviewer can read, not a
// prose summary of what would change).
export function printPlannedChange(before: unknown, after: unknown): void {
  console.log(
    JSON.stringify({ before, after }, null, 2)
      .split("\n")
      .map((l) => "  " + l)
      .join("\n"),
  );
}

// Per-item outcome accumulator for a datafix step's run loop (e.g. once per race,
// per user, per payload). Wraps the plan/noop/applied/failed counting AND the
// per-item console output every existing script hand-rolls today, so a script's
// loop body is just "call the matching outcome method." reporter.result() returns
// a plain DatafixStepResult, so it composes directly with printStepSummary — this
// accumulates, it doesn't replace the end-of-run summary:
//
//   const reporter = createDatafixReporter(opts);
//   for (const item of items) { ...reporter.applied(item.label) or .noop/.plan/.error... }
//   return reporter.result();
//   // caller: printStepSummary(label, reporter.result(), opts)
export interface DatafixReporter {
  /** No change needed for this item — already matches the target state. */
  noop(label: string, reason?: string): void;
  /** A change is available but not being written (dry-run, or --yes not passed yet). Prints before/after. */
  plan(label: string, before: unknown, after: unknown, reason?: string): void;
  /** A change was written for this item. */
  applied(label: string, detail?: string): void;
  /** This item failed and was skipped; does not abort the run. */
  error(label: string, err: unknown): void;
  /** Snapshot of counts so far, in the same shape printStepSummary expects. */
  result(): DatafixStepResult;
}

export function createDatafixReporter(opts: Pick<DatafixOpts, "dryRun" | "confirmed">): DatafixReporter {
  const { dryRun } = opts;
  let applied = 0;
  let skipped = 0;
  let pending = 0;
  let failed = 0;

  return {
    noop(label, reason) {
      skipped++;
      console.log(`ok (no-op): ${label}${reason ? ` — ${reason}` : ""}`);
    },
    plan(label, before, after, reason) {
      pending++;
      console.log(`${dryRun ? "would apply" : "planned"}: ${label}${reason ? ` — ${reason}` : ""}`);
      printPlannedChange(before, after);
    },
    applied(label, detail) {
      applied++;
      console.log(`applied: ${label}${detail ? ` — ${detail}` : ""}`);
    },
    error(label, err) {
      failed++;
      console.error(`FAIL: ${label} —`, err);
    },
    result(): DatafixStepResult {
      return { applied, skipped, pending, failed };
    },
  };
}

// One id per script invocation, used to namespace that run's revert snapshots
// (see writeDatafixRevertSnapshot below). `datafixId` is a short, stable, unique
// id each datafix script defines for itself (e.g. "remove-dan1-test-league-data")
// and is required — every datafix script must explicitly supply one — so that a
// revert snapshot's runId reveals which script produced it without opening the
// snapshot. Timestamp next so snapshots sort chronologically within a script's
// runs; short random suffix so two runs started in the same second (e.g. two
// steps under run-prod-datafixes.ts) don't collide.
export function generateDatafixRunId(datafixId: string): string {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const rand = Math.random().toString(36).slice(2, 8);
  return `${datafixId}-${ts}-${rand}`;
}

// Writes the raw pre-write JSON for `originalPath` into the SAME blob store, under a
// reserved `_datafix-reverts/{runId}/` prefix, before the real write happens — so a
// bad prod write is hand-recoverable from the blob store itself. Write-only: there is
// deliberately no restore/apply-revert tooling yet, just get the snapshot stored.
export async function writeDatafixRevertSnapshot(
  blobStore: BlobStore,
  runId: string,
  originalPath: string,
  data: unknown,
): Promise<void> {
  await blobStore.write(`_datafix-reverts/${runId}/${originalPath}`, data);
}
