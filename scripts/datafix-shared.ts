import { fileURLToPath } from "node:url";
import { config } from "dotenv";

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

export function parseDatafixArgs(argv: string[]): DatafixOpts {
  const dryRun = argv.includes("--dry-run");
  const confirmed = argv.includes("--yes");
  const envFileArg = argv.find((a) => a.startsWith("--env-file="));
  const envFile = envFileArg ? envFileArg.slice("--env-file=".length) : ".env.local";
  return { dryRun, confirmed, envFile };
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
  const { dryRun, confirmed, envFile } = opts;
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
    `mode:             ${dryRun ? "dry-run (no writes)" : confirmed ? "REAL WRITE (--yes)" : "preview only (pass --yes to write)"}`,
  );
  console.log("=".repeat(60));
}

export function printStepSummary(label: string, result: DatafixStepResult, opts: DatafixOpts): void {
  const { dryRun, confirmed, envFile } = opts;
  if (dryRun) {
    console.log(`\n[${label}] dry run done — ${result.pending} change(s) would apply, ${result.skipped} already clean`);
  } else if (!confirmed) {
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
