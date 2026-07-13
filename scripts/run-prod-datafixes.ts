import {
  type DatafixOpts,
  emptyStepResult,
  loadDatafixEnv,
  mergeStepResults,
  parseDatafixArgs,
  printDatafixBanner,
  printStepSummary,
} from "./datafix-shared.ts";
import { runBackfillPredictions } from "./backfill-predictions.ts";
import { runApplyCorrectedRaceKeys } from "./apply-corrected-race-keys.ts";
import { runRemoveDan1Data } from "./remove-dan1-test-league-data.ts";

// Single entrypoint for every datafix that needs to run against prod: backfilling
// missing predictions, correcting wrong/missing race answer keys, and removing Dan 1's
// duplicate-account TEST LEAGUE data. Runs the three steps in order, isolating
// failures per step so one broken step doesn't block the others.
//
// Preview (no writes):
//   VERCEL=1 pnpm run-prod-datafixes -- --dry-run --env-file=.env.local
//
// Real write:
//   VERCEL=1 pnpm run-prod-datafixes -- --yes --env-file=.env.local
//
// Each step is also runnable standalone (pnpm backfill-predictions / apply-race-keys /
// remove-dan1-data) with the exact same flags, unchanged.

const STEPS: { label: string; run: (opts: DatafixOpts) => ReturnType<typeof runBackfillPredictions> }[] = [
  { label: "backfill-predictions", run: runBackfillPredictions },
  { label: "apply-corrected-race-keys", run: runApplyCorrectedRaceKeys },
  { label: "remove-dan1-test-league-data", run: runRemoveDan1Data },
];

async function main() {
  const opts = parseDatafixArgs(process.argv.slice(2));

  // Loaded once, before any step runs — every step's own dynamic repository imports
  // (deferred to inside each run function) will see these env vars regardless of
  // which step first triggers the import.
  loadDatafixEnv(opts.envFile);
  printDatafixBanner(opts, [`steps:            ${STEPS.map((s) => s.label).join(" -> ")}`]);

  let total = emptyStepResult();
  const outcomes: { label: string; ok: boolean }[] = [];

  for (const step of STEPS) {
    console.log(`\n${"#".repeat(60)}`);
    console.log(`# ${step.label}`);
    console.log("#".repeat(60));
    try {
      const result = await step.run(opts);
      printStepSummary(step.label, result, opts);
      total = mergeStepResults(total, result);
      outcomes.push({ label: step.label, ok: result.failed === 0 });
    } catch (e) {
      console.error(`\n[${step.label}] step threw and was skipped:`, e);
      total = mergeStepResults(total, { applied: 0, skipped: 0, pending: 0, failed: 1 });
      outcomes.push({ label: step.label, ok: false });
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("combined summary");
  console.log("=".repeat(60));
  for (const o of outcomes) {
    console.log(`  ${o.ok ? "OK  " : "FAIL"}  ${o.label}`);
  }
  const okCount = outcomes.filter((o) => o.ok).length;
  console.log(`\n${okCount}/${outcomes.length} step(s) completed cleanly`);
  if (opts.dryRun) {
    console.log(`${total.pending} total change(s) would apply, ${total.skipped} already clean`);
  } else if (!opts.confirmed) {
    console.log(`${total.pending} total change(s) pending, ${total.skipped} already clean. Re-run with --yes to apply against ${opts.envFile}.`);
  } else {
    console.log(`${total.applied} total applied, ${total.skipped} already clean, ${total.failed} failed`);
  }

  if (total.failed > 0) process.exitCode = 1;
}

main();
