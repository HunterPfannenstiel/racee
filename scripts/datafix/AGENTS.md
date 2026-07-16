# Datafixes

This directory holds one-off, operator-run production data corrections. A datafix is not a business action and carries no business vocabulary — it reads and writes through the project's data layer directly, never through the application. scripts/migration/ is a separate, unrelated pipeline (data extraction/formatting) and is not governed by this file.

## Standards
* One file per datafix, under scripts/datafix/<kebab-case-name>.ts
* A datafix with its own dedicated input data lives in its own scripts/datafix/<name>/<name>.ts + scripts/datafix/<name>/data/ folder instead — see apply-corrected-race-keys/ for the pattern. A datafix with no dedicated data of its own stays a flat file directly under scripts/datafix/
* A datafix exports an async run<Name>(opts: { dryRun: boolean; confirmed: boolean }): Promise<DatafixStepResult> — this is what scripts/datafix/run-prod-datafixes.ts calls when running every datafix together
* A datafix also has a standalone CLI entry, gated by isMainModule(import.meta.url) — this is what lets it run alone via `tsx scripts/datafix/<name>.ts`
* A datafix defines its own DATAFIX_ID constant — a short, stable, unique string that namespaces its revert snapshots. There is no default; every datafix must declare one
* All CLI parsing, env loading, banners, and reporting come from scripts/datafix/shared/datafix-shared.ts — a datafix never reimplements --dry-run/--yes/--env-file parsing, dry-run output formatting, or its own applied/skipped/pending/failed summary
* A datafix reads and writes through the project's current data-layer primitive (`blob` from lib/blob today) directly — never through a repository, entity, service, or command. The one exception is importing an existing zod schema purely for shape validation
* That exception is absolute — a read-only lookup (e.g. resolving a title to an id) is a direct blob read validated by the relevant schema too, never a repository class or domain entity, even though nothing is being written
* A schema needed for validation that's currently private to a repository gets relocated, not duplicated, into its own module the repository and the datafix both import — see server/repositories/race-prediction-book/schema.ts for the pattern
* A datafix computes its target state as a pure, in-memory transform of the current state — no I/O inside the transform itself
* A pure transform may take a non-deterministic value (e.g. the current timestamp) as a parameter generated once at the call site — it never generates one internally or performs I/O itself
* Idempotency is deepEqual(current, target) from datafix-shared.ts, never a hand-rolled boolean flag
* A stamped field the transform would otherwise always refresh (e.g. a setAt/updatedAt timestamp) only changes when the data it's attached to actually changes — otherwise deepEqual can never report a true no-op. See apply-corrected-race-keys.ts's withCorrectedKey, which returns the same input reference untouched when nothing meaningful changed
* A real write is always preceded by writeDatafixRevertSnapshot(blob, runId, path, current), where runId = generateDatafixRunId(DATAFIX_ID) — this is unconditional, not optional per-datafix
* When one write batches multiple items sharing a path (one read, N item transforms, one write), reporter.applied() for an item is deferred until that write actually succeeds — never called optimistically beforehand. On write failure, every item that would have been applied is reported as an error instead, not dropped silently. See apply-corrected-race-keys.ts and backfill-predictions.ts (a pendingApplied list flushed to the reporter only after the write succeeds, inside its own try/catch)
* Whether a run is a real write is always resolveDatafixMode(opts) / willWrite(opts) — never a hand-rolled !dryRun && confirmed
* A datafix only corrects source-of-truth data. It never recomputes or writes derived/projected data (e.g. scores, standings) — that recalculation is a separate, out-of-scope concern
* Per-item failure handling (isolate and continue vs. abort) is not yet standardized across datafixes — decide it deliberately per script and say so in the script's header comment, don't default to one silently

## Adding a datafix to the batch runner
* Import its run<Name> function into scripts/datafix/run-prod-datafixes.ts and call it alongside the others — one step throwing does not stop the rest from running

Example: scripts/datafix/remove-dan1-test-league-data.ts
```ts
const DATAFIX_ID = "remove-dan1-test-league-data";

export async function runRemoveDan1Data(opts: { dryRun: boolean; confirmed: boolean }): Promise<DatafixStepResult> {
  const shouldWrite = willWrite(opts);
  const runId = generateDatafixRunId(DATAFIX_ID);
  const reporter = createDatafixReporter(opts);

  // Race titles resolved to ids via a direct blob read, validated by RacePersistenceSchema
  // — no repository, even for this read-only lookup.
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
      if (raw === null) { reporter.noop(race.title, "no predictions.json for this league/race"); continue; }

      const current = PredictionsPersistenceSchema.parse(raw);
      const target = removeUserFromPredictions(current, TARGET_USER_ID);
      PredictionsPersistenceSchema.parse(target);

      if (deepEqual(current, target)) { reporter.noop(race.title, "no data for target user"); continue; }
      if (!shouldWrite) { reporter.plan(race.title, current, target); continue; }

      await writeDatafixRevertSnapshot(blob, runId, path, current);
      await blob.write(path, target);
      reporter.applied(race.title, "removed target user's prediction data");
    } catch (e) {
      reporter.error(race.title, e);
    }
  }

  return reporter.result();
}
```
