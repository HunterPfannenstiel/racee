import { fileURLToPath } from "node:url";
import type { BlobStore } from "@/lib/blob/interface";
import { usingSupabaseBlobStore } from "@/lib/blob/backend";

// Shared by every prod-datafix script (apply-corrected-race-keys, backfill-predictions,
// remove-dan1-test-league-data, run-prod-datafixes) so the CLI conventions — env
// loading, --dry-run/--yes parsing, banner, per-step summary — stay
// identical across all of them instead of being hand-copied per file.

export interface DatafixOpts {
  dryRun: boolean;
  confirmed: boolean;
  verbose: boolean;
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

const VALID_DATAFIX_FLAGS = "--dry-run, --yes, --verbose";

// Every argv entry must be exactly one of --dry-run, --yes, or --verbose. Anything else
// throws instead of being silently dropped: a typo'd flag (e.g. "-dry-run") combined with
// --yes must never be mistaken by the operator for a safe preview when it's actually
// about to perform a real write.
export function parseDatafixArgs(argv: string[]): DatafixOpts {
  const unrecognized = argv.filter((a) => a !== "--dry-run" && a !== "--yes" && a !== "--verbose");
  if (unrecognized.length > 0) {
    throw new Error(
      `unrecognized datafix argument(s): ${unrecognized.join(", ")} — valid flags are: ${VALID_DATAFIX_FLAGS}`,
    );
  }

  const dryRun = argv.includes("--dry-run");
  const confirmed = argv.includes("--yes");
  const verbose = argv.includes("--verbose");
  return { dryRun, confirmed, verbose };
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

export function printDatafixBanner(opts: DatafixOpts, extraLines: string[] = []): void {
  const mode = resolveDatafixMode(opts);
  const environment = process.env.DATAFIX_ENVIRONMENT ?? "local";
  const backend = usingSupabaseBlobStore() ? "SupabaseBlobStore" : "LocalBlobStore";
  console.log("=".repeat(60));
  console.log(`environment:      ${environment}`);
  console.log(
    `storage backend:  ${backend}` +
      (usingSupabaseBlobStore() ? "" : "  (writes to .blob-store/ on local disk, NOT Supabase — set SUPABASE_URL to target Supabase)"),
  );
  if (usingSupabaseBlobStore()) {
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
  const mode = resolveDatafixMode(opts);
  if (mode === "dry-run") {
    console.log(`\n[${label}] dry run done — ${result.pending} change(s) would apply, ${result.skipped} already clean`);
  } else if (mode === "preview") {
    console.log(`\n[${label}] preview only — ${result.pending} change(s) pending, ${result.skipped} already clean. Re-run with --yes to apply.`);
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

// Prints the exact before/after JSON for one planned change. Verbose-only (see
// DatafixReporter.plan below) — useful when a summary line isn't enough to trust
// the change, but too noisy to be the default for every item in a run.
export function printPlannedChange(before: unknown, after: unknown): void {
  console.log(
    JSON.stringify({ before, after }, null, 2)
      .split("\n")
      .map((l) => "  " + l)
      .join("\n"),
  );
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// One-line human-readable diff for a planned change — the default DatafixReporter.plan
// output, since raw before/after JSON is too noisy to read per-item across a whole run.
// Built for the datafix standard's typical blob shape: a JSON object whose top-level
// fields are themselves userId/entityId-keyed maps (predictions.json's predictions/
// submittedAt/submittedBy/propPicks is the canonical example) — so it walks exactly one
// level deep, reporting which keys were added/removed/changed inside each top-level
// field. Anything shallower or deeper than that falls back to a coarser "changed" note
// rather than guessing at structure.
export function summarizeDiff(before: unknown, after: unknown): string {
  if (deepEqual(before, after)) return "no change";
  if (!isPlainObject(before) || !isPlainObject(after)) return "changed";

  const lines: string[] = [];
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const b = before[key];
    const a = after[key];
    if (deepEqual(b, a)) continue;

    if (isPlainObject(b) && isPlainObject(a)) {
      const bKeys = new Set(Object.keys(b));
      const aKeys = new Set(Object.keys(a));
      const added = [...aKeys].filter((k) => !bKeys.has(k));
      const removed = [...bKeys].filter((k) => !aKeys.has(k));
      const changed = [...bKeys].filter((k) => aKeys.has(k) && !deepEqual(b[k], a[k]));
      const parts = [
        removed.length > 0 && `-${removed.length} (${removed.join(", ")})`,
        added.length > 0 && `+${added.length} (${added.join(", ")})`,
        changed.length > 0 && `~${changed.length} (${changed.join(", ")})`,
      ].filter(Boolean);
      lines.push(`${key}: ${parts.join(", ")}`);
    } else {
      lines.push(`${key}: changed`);
    }
  }
  return lines.join("; ");
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
  /** A change is available but not being written (dry-run, or --yes not passed yet). Prints a one-line diff summary (full before/after JSON too, under --verbose). */
  plan(label: string, before: unknown, after: unknown, reason?: string): void;
  /** A change was written for this item. */
  applied(label: string, detail?: string): void;
  /** This item failed and was skipped; does not abort the run. */
  error(label: string, err: unknown): void;
  /** Snapshot of counts so far, in the same shape printStepSummary expects. */
  result(): DatafixStepResult;
}

export function createDatafixReporter(opts: Pick<DatafixOpts, "dryRun" | "confirmed" | "verbose">): DatafixReporter {
  const { dryRun, verbose } = opts;
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
      console.log(`  ${summarizeDiff(before, after)}`);
      if (verbose) printPlannedChange(before, after);
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
