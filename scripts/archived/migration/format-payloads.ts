// Phase B (format step) of the Excel -> app migration: pure transform.
//
// Takes Phase A's extraction output (scripts/archived/migration/output/*.json) plus
// the human-reviewed resolution manifest (scripts/archived/migration/output/resolution/)
// and produces PredictionMutationSchema-shaped payloads per race. Does NOT
// write to blob storage, does NOT call PredictionService or any app code,
// does NOT make network calls. A separate load script (not yet written)
// consumes these payload files to actually write predictions.
//
// Run: npx tsx scripts/archived/migration/format-payloads.ts

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { PredictionMutationSchema } from "../../lib/schemas";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "output");
const RESOLUTION_DIR = path.join(OUTPUT_DIR, "resolution");
const PAYLOADS_DIR = path.join(OUTPUT_DIR, "payloads");

const LEAGUE_ID = "1c527405-c475-4e55-ace6-5ec7a53d1b3b";

const RACES: { extractFile: string; label: string; raceId: string }[] = [
  { extractFile: "Australia_.json", label: "Australia", raceId: "fac1c620-3387-45b9-8186-91c34e8a6d75" },
  { extractFile: "China.json", label: "China", raceId: "a4b63463-b6f9-4436-9d94-28ef542d4fc6" },
  { extractFile: "Japan.json", label: "Japan", raceId: "7c789b7e-7800-4399-b92a-7a2ea7b2c791" },
  { extractFile: "Miami.json", label: "Miami", raceId: "50ead40f-d21a-4775-a101-4d841171ab63" },
  { extractFile: "Canada.json", label: "Canada", raceId: "f523c448-c776-4c29-973c-fbd5c22014c9" },
];

const PROP_NAMES = [
  "driverOfDay",
  "lapsLed",
  "fastestPitStop",
  "fastestLap",
  "overAchiever",
  "underAchiever",
  "wrecker",
] as const;
type PropName = (typeof PROP_NAMES)[number];

type ResolvedEntry = { raw: string; resolved: string | null; method: string };

type ExtractedPrediction = {
  playerName: string;
  email: string;
  userId: string | null;
  teamNameRaw: string;
  order: { position: number; driverNameRaw: string; racerId: string | null }[];
};

type ExtractedPropPicks = {
  playerName: string;
  teamNameRaw: string;
  picks: Partial<Record<PropName, ResolvedEntry | null>>;
};

type ExtractFile = {
  sourceFile: string;
  raceLabel: string;
  predictions: Record<string, ExtractedPrediction>;
  propPicks: Record<string, ExtractedPropPicks>;
};

type IssuesFile = {
  race: string;
  sourceFile: string;
  blocking: { code: string; message: string; context?: Record<string, unknown> }[];
  warnings: { code: string; message: string; context?: Record<string, unknown> }[];
  notes: { code: string; message: string; context?: Record<string, unknown> }[];
};

type TeamNameEntry = { teamId: string; method: string; note?: string };
type DriverNameEntry = { racerId: string; prodName: string; team: string; method: string };
type PlayerNameEntry = {
  userId: string;
  authName: string;
  authEmail: string;
  method: string;
  confidence?: string;
  note?: string;
};
type ConstructorNameEntry = { team: string; method: string; note?: string };

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

const teamNames = readJson<Record<string, TeamNameEntry>>(path.join(RESOLUTION_DIR, "team-names.json"));
const driverNames = readJson<Record<string, DriverNameEntry>>(path.join(RESOLUTION_DIR, "driver-names.json"));
const constructorNames = readJson<Record<string, ConstructorNameEntry>>(
  path.join(RESOLUTION_DIR, "constructor-names.json"),
);
const playerNamesFile = readJson<{ resolved: Record<string, Record<string, PlayerNameEntry>> }>(
  path.join(RESOLUTION_DIR, "player-names.json"),
);

// player-names.json is keyed by the CANONICAL prod team name (e.g. "Zeus
// Racing", "No Drag, Only Lift"), not whatever raw spelling a given sheet tab
// used (e.g. "Zues Racing", "Team 3" — the latter never spells out the real
// name anywhere in the workbook). Join through teamId using prod teams.json
// itself as the id->name source of truth, not team-names.json's own keys
// (which are raw sheet spellings and may not include the canonical name at all).
const PROD_TEAMS_PATH = path.resolve(
  __dirname,
  "../../../backups/2026-07-11T19-58-35-808Z/data/leagues",
  LEAGUE_ID,
  "teams.json",
);
const prodTeams = readJson<{ id: string; name: string }[]>(PROD_TEAMS_PATH);
const teamIdToCanonicalName = new Map(prodTeams.map((t) => [t.id, t.name]));

type SkipReason = {
  code: string;
  playerName: string;
  teamNameRaw: string;
  userId: string | null;
  message: string;
  context?: Record<string, unknown>;
};

type PayloadIssue = {
  code: string;
  playerName: string;
  userId: string | null;
  message: string;
  context?: Record<string, unknown>;
};

mkdirSync(PAYLOADS_DIR, { recursive: true });

let totalGenerated = 0;
let totalSkipped = 0;
const summaryLines: string[] = [];
summaryLines.push("# Phase B payload generation summary\n");
summaryLines.push(
  "Pure transform: Phase A extraction + human-reviewed resolution manifest -> `PredictionMutationSchema` payloads. " +
    "No blob writes, no app code calls, no network calls. A separate load script consumes these.\n",
);

for (const race of RACES) {
  const extractPath = path.join(OUTPUT_DIR, race.extractFile);
  const issuesPath = path.join(OUTPUT_DIR, race.extractFile.replace(".json", ".issues.json"));
  const extracted = readJson<ExtractFile>(extractPath);
  const issues = readJson<IssuesFile>(issuesPath);

  const emptyPredictionPlayers = new Set(
    issues.warnings.filter((w) => w.code === "EMPTY_PREDICTION").map((w) => w.context?.player as string),
  );
  const duplicateDriverPlayers = new Set(
    issues.warnings.filter((w) => w.code === "DUPLICATE_DRIVER_IN_PREDICTION").map((w) => w.context?.player as string),
  );

  const payloads: z.infer<typeof PredictionMutationSchema>[] = [];
  const raceSkips: SkipReason[] = [];
  const raceFlags: PayloadIssue[] = [];

  const playerEntries = Object.values(extracted.predictions);

  for (const pred of playerEntries) {
    const { playerName, teamNameRaw } = pred;

    // Team resolution
    const teamEntry = teamNames[teamNameRaw];
    if (!teamEntry) {
      raceSkips.push({
        code: "UNRESOLVED_TEAM",
        playerName,
        teamNameRaw,
        userId: null,
        message: `Team sheet name "${teamNameRaw}" has no entry in team-names.json`,
      });
      totalSkipped++;
      continue;
    }

    // Player resolution — scoped to the resolved team's bucket in player-names.json,
    // joined via teamId since the sheet's raw team-name spelling may differ from
    // the canonical name used as the key there (see teamIdToCanonicalName above).
    const canonicalTeamName = teamIdToCanonicalName.get(teamEntry.teamId);
    const teamPlayers = canonicalTeamName ? playerNamesFile.resolved[canonicalTeamName] : undefined;
    const playerEntry = teamPlayers?.[playerName];
    if (!playerEntry) {
      raceSkips.push({
        code: "UNRESOLVED_PLAYER",
        playerName,
        teamNameRaw,
        userId: null,
        message: `Player "${playerName}" on team "${teamNameRaw}" has no entry in player-names.json`,
      });
      totalSkipped++;
      continue;
    }
    const userId = playerEntry.userId;

    // Known edge case: zero submitted picks (e.g. China's Mile High duo).
    // Confirmed by Phase A as a genuine source-data gap, not a parser bug.
    if (emptyPredictionPlayers.has(playerName) || pred.order.length === 0) {
      raceSkips.push({
        code: "EMPTY_PREDICTION",
        playerName,
        teamNameRaw,
        userId,
        message: `Player "${playerName}" (team "${teamNameRaw}") has zero picks in the source Weekly Lineups — no payload generated.`,
      });
      totalSkipped++;
      continue;
    }

    // Driver picks -> prod racerIds via the global driver-names resolver.
    // Deliberately re-resolve from driverNameRaw rather than trusting Phase
    // A's embedded racerId, which was resolved against LOCAL DEV racers.json
    // (different blob store, different UUIDs) not prod.
    const racerIds: string[] = [];
    let unresolvedDriver: string | null = null;
    for (const pick of pred.order) {
      const driverEntry = driverNames[pick.driverNameRaw];
      if (!driverEntry) {
        unresolvedDriver = pick.driverNameRaw;
        break;
      }
      racerIds.push(driverEntry.racerId);
    }
    if (unresolvedDriver) {
      raceSkips.push({
        code: "UNRESOLVED_DRIVER",
        playerName,
        teamNameRaw,
        userId,
        message: `Driver name "${unresolvedDriver}" in ${playerName}'s ranking has no entry in driver-names.json`,
      });
      totalSkipped++;
      continue;
    }

    // Structural sanity check on ranking length. 22 real drivers expected;
    // the known DUPLICATE_DRIVER_IN_PREDICTION cases still produce exactly
    // 22 entries (a real driver got crowded out by a duplicate pick), so
    // length 22 covers both the clean case and the known-duplicate case.
    // Anything else is unexpected and gets flagged, not silently trimmed/padded.
    if (racerIds.length !== 22) {
      raceFlags.push({
        code: "UNEXPECTED_RANKING_LENGTH",
        playerName,
        userId,
        message: `Expected 22 ranked picks, got ${racerIds.length} for "${playerName}" (team "${teamNameRaw}")`,
        context: { count: racerIds.length },
      });
    }
    if (duplicateDriverPlayers.has(playerName)) {
      raceFlags.push({
        code: "DUPLICATE_DRIVER_IN_PREDICTION",
        playerName,
        userId,
        message: `"${playerName}" has the same driver ranked more than once — carried through as-extracted per source data, not corrected. A real driver was crowded out of this ranking.`,
      });
    }

    // Prop picks: resolve each of the 7 to a racerId (6 props) or canonical
    // constructor-name string (fastestPitStop). The REAL app schema
    // (PredictionMutationSchema, and the frontend's own "Pick all props to
    // submit" gating in PredictionEditor.tsx) requires propPicks to be
    // all-7-or-nothing when present — z.record(PropNameSchema, z.string())
    // with an enum key schema demands every enum member. So a player who
    // only answered 6/7 in the spreadsheet cannot have a partial propPicks
    // object submitted through this schema. In that case we omit propPicks
    // entirely (racerIds still submit) rather than fabricate the missing
    // answer or fail validation, and flag it so it's visible.
    const propPicksEntry = extracted.propPicks[playerName];
    const propPicks: Partial<Record<PropName, string>> = {};
    const missingProps: string[] = [];
    const unresolvedProps: { prop: string; raw: string }[] = [];

    for (const prop of PROP_NAMES) {
      const entry = propPicksEntry?.picks[prop];
      if (!entry) {
        missingProps.push(prop);
        continue;
      }
      if (prop === "fastestPitStop") {
        const ctorEntry = constructorNames[entry.raw];
        if (!ctorEntry) {
          unresolvedProps.push({ prop, raw: entry.raw });
          continue;
        }
        propPicks.fastestPitStop = ctorEntry.team;
      } else {
        const driverEntry = driverNames[entry.raw];
        if (!driverEntry) {
          unresolvedProps.push({ prop, raw: entry.raw });
          continue;
        }
        propPicks[prop] = driverEntry.racerId;
      }
    }

    let includePropPicks = true;
    if (missingProps.length > 0 || unresolvedProps.length > 0) {
      includePropPicks = false;
      raceFlags.push({
        code: "PARTIAL_PROP_PICKS_OMITTED",
        playerName,
        userId,
        message:
          `"${playerName}" answered ${7 - missingProps.length - unresolvedProps.length}/7 props for ${race.label} ` +
          `(the real app requires all 7 or none) — propPicks omitted from this payload, racerIds still included. ` +
          `Missing: [${missingProps.join(", ") || "none"}]. Unresolved: [${unresolvedProps.map((u) => `${u.prop}="${u.raw}"`).join(", ") || "none"}].`,
        context: { missingProps, unresolvedProps },
      });
    }

    const candidate = {
      leagueId: LEAGUE_ID,
      raceId: race.raceId,
      userId,
      racerIds,
      ...(includePropPicks && Object.keys(propPicks).length > 0 ? { propPicks } : {}),
    };

    const validation = PredictionMutationSchema.safeParse(candidate);
    if (!validation.success) {
      raceSkips.push({
        code: "SCHEMA_VALIDATION_FAILED",
        playerName,
        teamNameRaw,
        userId,
        message: `Payload failed PredictionMutationSchema validation: ${validation.error.message}`,
      });
      totalSkipped++;
      continue;
    }

    payloads.push(validation.data);
    totalGenerated++;
  }

  writeFileSync(path.join(PAYLOADS_DIR, `${race.label}.payloads.json`), JSON.stringify(payloads, null, 2));
  writeFileSync(
    path.join(PAYLOADS_DIR, `${race.label}.payload-issues.json`),
    JSON.stringify({ race: race.label, skipped: raceSkips, flagged: raceFlags }, null, 2),
  );

  summaryLines.push(`## ${race.label}`);
  summaryLines.push(`- Generated: ${payloads.length}`);
  summaryLines.push(`- Skipped: ${raceSkips.length}`);
  if (raceSkips.length > 0) {
    for (const s of raceSkips) {
      summaryLines.push(`  - **${s.code}** — ${s.message}`);
    }
  }
  if (raceFlags.length > 0) {
    summaryLines.push(`- Flagged (payload still generated):`);
    for (const f of raceFlags) {
      summaryLines.push(`  - **${f.code}** — ${f.message}`);
    }
  }
  summaryLines.push("");
}

summaryLines.push("## Totals");
summaryLines.push(`- Payloads generated across all races: ${totalGenerated}`);
summaryLines.push(`- Skipped across all races: ${totalSkipped}`);
summaryLines.push("");
summaryLines.push("## Not done here (by design)");
summaryLines.push("- No writes to blob storage, no `PredictionService` calls, no network calls.");
summaryLines.push("- Bahrain/Saudi Arabia are still out of scope — no Excel source files yet.");
summaryLines.push(
  "- Every payload was validated against the real `PredictionMutationSchema` from `lib/schemas.ts` before being written.",
);

writeFileSync(path.join(PAYLOADS_DIR, "PAYLOAD_SUMMARY.md"), summaryLines.join("\n"));

console.log(`Generated ${totalGenerated} payloads, skipped ${totalSkipped}, across ${RACES.length} races.`);
console.log(`Output: ${PAYLOADS_DIR}`);
