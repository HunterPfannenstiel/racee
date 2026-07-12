// Phase B load script — writes the finalized prediction payloads
// (scripts/migration/output/payloads/*.payloads.json) into blob storage via the
// real PredictionService/domain classes, then triggers real grading.
//
// Run (dry-run, default — no writes anywhere):
//   VERCEL=1 BUCKET_NAME=<bucket> SUPABASE_URL=<url> SUPABASE_SECRET_KEY=<key> \
//     npx tsx scripts/migration/load-predictions.ts
//
// Run (real write):
//   VERCEL=1 BUCKET_NAME=<bucket> SUPABASE_URL=<url> SUPABASE_SECRET_KEY=<key> \
//     npx tsx scripts/migration/load-predictions.ts --write
//
// BUCKET_NAME is the ONLY thing separating itg (racee_integration) from prod (racee)
// in this Supabase project — there is no other environment boundary. All four vars
// below must be explicitly set on the invoking shell command; there is no fallback,
// no dotenv-loading of them by this script, and no default.

import { readFileSync, readdirSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const REQUIRED_ENV = ["VERCEL", "BUCKET_NAME", "SUPABASE_URL", "SUPABASE_SECRET_KEY"] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(
      `\nMissing required env var: ${key}\n\n` +
      `This script refuses to run with implicit/defaulted environment selection.\n` +
      `Invoke it like:\n` +
      `  VERCEL=1 BUCKET_NAME=<bucket> SUPABASE_URL=<url> SUPABASE_SECRET_KEY=<key> npx tsx scripts/migration/load-predictions.ts [--write]\n`
    );
    process.exit(1);
  }
}

const WRITE = process.argv.includes("--write");

console.log("=".repeat(72));
console.log(`TARGET BUCKET   : ${process.env.BUCKET_NAME}`);
console.log(`SUPABASE HOST   : ${new URL(process.env.SUPABASE_URL!).host}`);
console.log(`MODE            : ${WRITE ? "*** WRITE (will persist) ***" : "dry-run (no writes)"}`);
console.log("=".repeat(72));

// Imports below are hoisted by ESM but env vars are already set on process.env
// from the shell invocation before any module code runs, so lib/blob/index.ts's
// module-level `process.env.VERCEL ? ... : ...` check sees the right value.
const { blob } = await import("../../lib/blob/index.ts");
const { RACERS_PATH, LEAGUES_PATH, motorsportRacesPath, teamsPath, predictionsPath } =
  await import("../../lib/paths.ts");
const { PredictionService } = await import("../../server/services/PredictionService.ts");
const { RecalculateRaceCommand } = await import("../../server/commands/recalculate-race/RecalculateRaceCommand.ts");
const { BlobLeagueRepository } = await import("../../server/repositories/league/BlobLeagueRepository.ts");
const { BlobRaceRepository } = await import("../../server/repositories/race/BlobRaceRepository.ts");
const { BlobRacePredictionBookRepository } = await import("../../server/repositories/race-prediction-book/BlobRacePredictionBookRepository.ts");
const { BlobLeagueStandingsRepository } = await import("../../server/repositories/league-standings/BlobLeagueStandingsRepository.ts");
const { BlobTeamRepository } = await import("../../server/repositories/team/BlobTeamRepository.ts");

// ---------------------------------------------------------------------------
// Fixed identifiers for this batch
// ---------------------------------------------------------------------------

const LEAGUE_ID = "1c527405-c475-4e55-ace6-5ec7a53d1b3b";
const MOTORSPORT_ID = "9ff98309-13ac-4dd6-85db-a9afba01179f";

const RACES: { label: string; raceId: string; payloadFile: string }[] = [
  { label: "Australia", raceId: "fac1c620-3387-45b9-8186-91c34e8a6d75", payloadFile: "Australia.payloads.json" },
  { label: "China", raceId: "a4b63463-b6f9-4436-9d94-28ef542d4fc6", payloadFile: "China.payloads.json" },
  { label: "Japan", raceId: "7c789b7e-7800-4399-b92a-7a2ea7b2c791", payloadFile: "Japan.payloads.json" },
  { label: "Miami", raceId: "50ead40f-d21a-4775-a101-4d841171ab63", payloadFile: "Miami.payloads.json" },
  { label: "Canada", raceId: "f523c448-c776-4c29-973c-fbd5c22014c9", payloadFile: "Canada.payloads.json" },
];

type Payload = {
  leagueId: string;
  raceId: string;
  userId: string;
  racerIds: string[];
  propPicks?: Record<string, string>;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAYLOADS_DIR = join(__dirname, "output", "payloads");

function loadPayloads(fileName: string): Payload[] {
  const raw = readFileSync(join(PAYLOADS_DIR, fileName), "utf-8");
  return JSON.parse(raw) as Payload[];
}

// ---------------------------------------------------------------------------
// 1. Preflight: does the target bucket's reference data actually line up?
// ---------------------------------------------------------------------------

console.log("\n--- Preflight: reference-data integrity ---\n");

let preflightOk = true;

const leagues = (await blob.read<any[]>(LEAGUES_PATH)) ?? [];
const league = leagues.find((l) => l.id === LEAGUE_ID);
if (!league) {
  preflightOk = false;
  console.log(`FAIL  League ${LEAGUE_ID} not found in ${LEAGUES_PATH} (bucket has ${leagues.length} leagues)`);
} else {
  console.log(`OK    League found: "${league.name}" (${league.memberIds?.length ?? 0} members)`);
}

const races = (await blob.read<any[]>(motorsportRacesPath(MOTORSPORT_ID))) ?? [];
for (const r of RACES) {
  const found = races.find((x) => x.id === r.raceId);
  if (!found) {
    preflightOk = false;
    console.log(`FAIL  Race "${r.label}" (${r.raceId}) not found in motorsport races.json`);
  } else {
    console.log(`OK    Race "${r.label}" found: title="${found.title}" label="${found.label ?? ""}" date=${found.date} keyOrder=${found.keyOrder ? `${found.keyOrder.length} drivers` : "null (ungraded)"}`);
  }
}

const racers = (await blob.read<any[]>(RACERS_PATH)) ?? [];
const racerIdSet = new Set(racers.map((r) => r.id));
console.log(`INFO  ${racers.length} racers in bucket's racers.json`);

const teams = (await blob.read<any[]>(teamsPath(LEAGUE_ID))) ?? [];
const teamMemberIdSet = new Set(teams.flatMap((t) => t.memberIds ?? []));
const leagueMemberIdSet = new Set(league?.memberIds ?? []);
console.log(`INFO  ${teams.length} teams / ${teamMemberIdSet.size} team-member userIds for this league`);

// Load all payloads and spot-check every referenced racerId/userId
const allPayloads: { race: string; payload: Payload }[] = [];
for (const r of RACES) {
  for (const p of loadPayloads(r.payloadFile)) {
    allPayloads.push({ race: r.label, payload: p });
  }
}

const unresolvedRacerIds = new Map<string, string[]>(); // racerId -> [race:user, ...]
const unresolvedUserIds = new Map<string, string[]>();

for (const { race, payload } of allPayloads) {
  if (!teamMemberIdSet.has(payload.userId) && !leagueMemberIdSet.has(payload.userId)) {
    unresolvedUserIds.set(payload.userId, [...(unresolvedUserIds.get(payload.userId) ?? []), race]);
  }
  for (const rid of payload.racerIds) {
    if (!racerIdSet.has(rid)) {
      unresolvedRacerIds.set(rid, [...(unresolvedRacerIds.get(rid) ?? []), `${race}:${payload.userId}`]);
    }
  }
  for (const [propName, val] of Object.entries(payload.propPicks ?? {})) {
    if (propName === "fastestPitStop") continue; // constructor name string, not a racerId
    if (!racerIdSet.has(val)) {
      unresolvedRacerIds.set(val, [...(unresolvedRacerIds.get(val) ?? []), `${race}:${payload.userId}:${propName}`]);
    }
  }
}

console.log(`\nINFO  ${allPayloads.length} total payloads loaded across ${RACES.length} races`);
if (unresolvedUserIds.size > 0) {
  preflightOk = false;
  console.log(`FAIL  ${unresolvedUserIds.size} userId(s) referenced in payloads not found in this bucket's league/team membership:`);
  for (const [id, races] of unresolvedUserIds) console.log(`        ${id} (${races.join(", ")})`);
} else {
  console.log(`OK    Every payload userId resolves against this bucket's team/league membership`);
}
if (unresolvedRacerIds.size > 0) {
  preflightOk = false;
  console.log(`FAIL  ${unresolvedRacerIds.size} racerId(s)/value(s) referenced in payloads not found in this bucket's racers.json:`);
  for (const [id, refs] of unresolvedRacerIds) console.log(`        ${id} (${refs.slice(0, 3).join(", ")}${refs.length > 3 ? ` +${refs.length - 3} more` : ""})`);
} else {
  console.log(`OK    Every payload racerId resolves against this bucket's racers.json`);
}

console.log(`\nPreflight result: ${preflightOk ? "PASS" : "FAIL"}`);

// ---------------------------------------------------------------------------
// 2. Existing-state check per race
// ---------------------------------------------------------------------------

console.log("\n--- Existing prediction state per race ---\n");

const existingByRace = new Map<string, Set<string>>();
for (const r of RACES) {
  const existing = await blob.read<any>(predictionsPath(LEAGUE_ID, r.raceId));
  const existingUserIds = existing ? Object.keys(existing.predictions ?? {}) : [];
  existingByRace.set(r.raceId, new Set(existingUserIds));
  if (existingUserIds.length === 0) {
    console.log(`OK    ${r.label}: no existing predictions (empty or nonexistent) — expected`);
  } else {
    console.log(`WARN  ${r.label}: ${existingUserIds.length} existing prediction(s) already present — would be overwritten for matching userIds: [${existingUserIds.join(", ")}]`);
  }
}

// ---------------------------------------------------------------------------
// 3. Dry-run summary
// ---------------------------------------------------------------------------

console.log("\n--- Dry-run summary ---\n");

for (const r of RACES) {
  const payloads = loadPayloads(r.payloadFile);
  const existing = existingByRace.get(r.raceId)!;
  const overwrites = payloads.filter((p) => existing.has(p.userId));
  const net_new = payloads.length - overwrites.length;
  console.log(`${r.label}: ${payloads.length} payload(s) to submit (${net_new} new, ${overwrites.length} would overwrite existing)`);
  if (overwrites.length > 0) {
    console.log(`   overwrite: ${overwrites.map((p) => p.userId).join(", ")}`);
  }
}

if (!WRITE) {
  console.log("\nDry-run complete. No writes performed. Pass --write to persist for real.");
  process.exit(preflightOk ? 0 : 1);
}

if (!preflightOk) {
  console.error("\nRefusing to --write: preflight checks failed. Fix the mismatches above first.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 4. Real write, via the actual domain/service layer
// ---------------------------------------------------------------------------

console.log("\n--- Writing (--write) ---\n");

const bookRepo = new BlobRacePredictionBookRepository();
const predictionService = new PredictionService(bookRepo);
const recalculateRaceCommand = new RecalculateRaceCommand(
  new BlobRaceRepository(),
  new BlobLeagueRepository(),
  bookRepo,
  new BlobLeagueStandingsRepository(),
  new BlobTeamRepository(),
);

const now = new Date().toISOString();

for (const r of RACES) {
  const payloads = loadPayloads(r.payloadFile);
  console.log(`\n${r.label} (${payloads.length} payloads):`);
  for (const p of payloads) {
    await predictionService.submitPrediction(
      p.leagueId,
      p.raceId,
      p.userId,
      p.racerIds,
      p.propPicks ?? {},
      now,
      null,
    );
    console.log(`  submitted ${p.userId}`);
  }
  console.log(`  recalculating grades for ${r.label}...`);
  await recalculateRaceCommand.execute({ motorsportId: MOTORSPORT_ID, raceId: r.raceId });
  console.log(`  done: ${r.label}`);
}

console.log("\nAll races loaded and regraded.");
