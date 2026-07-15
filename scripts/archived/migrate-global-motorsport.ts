/* ARCHIVED — one-off script, no longer run. Commented out so it stays excluded from typecheck/lint.

import { blob } from "../lib/blob/index.ts";
import { randomUUID } from "crypto";

const MOTORSPORTS_PATH = "motorsports.json";
const LEAGUES_PATH = "leagues.json";
const RACERS_PATH = "racers.json";

// 1. Create F1 motorsport if it doesn't exist
const existing = await blob.read<{ id: string; name: string; slug: string }[]>(MOTORSPORTS_PATH).then(r => r ?? []);

let f1Id: string;
const f1Entry = existing.find((m) => m.slug === "f1");

if (!f1Entry) {
  f1Id = randomUUID();
  await blob.write(MOTORSPORTS_PATH, [...existing, { id: f1Id, name: "Formula 1", slug: "f1" }]);
  console.log(`created motorsport: Formula 1 (${f1Id})`);
} else {
  f1Id = f1Entry.id;
  console.log(`motorsport already exists: Formula 1 (${f1Id})`);
}

// 2. Backfill leagues
const leagues = await blob.read<{ id: string; motorsportId?: string }[]>(LEAGUES_PATH).then(r => r ?? []);

let leaguesMigrated = 0;
const updatedLeagues = leagues.map((league) => {
  if (league.motorsportId) return league;
  leaguesMigrated++;
  return { ...league, motorsportId: f1Id };
});

if (leaguesMigrated > 0) {
  await blob.write(LEAGUES_PATH, updatedLeagues);
  console.log(`migrated ${leaguesMigrated} league(s) — motorsportId set to ${f1Id}`);
} else {
  console.log("no leagues needed migration");
}

// 3. Backfill racers
const racers = await blob.read<{ id: string; motorsportId?: string }[]>(RACERS_PATH).then(r => r ?? []);

let racersMigrated = 0;
const updatedRacers = racers.map((racer) => {
  if (racer.motorsportId) return racer;
  racersMigrated++;
  return { ...racer, motorsportId: f1Id };
});

if (racersMigrated > 0) {
  await blob.write(RACERS_PATH, updatedRacers);
  console.log(`migrated ${racersMigrated} racer(s) — motorsportId set to ${f1Id}`);
} else {
  console.log("no racers needed migration");
}

// 4. Migrate per-league races to global motorsport path
// Use the fully migrated leagues (with motorsportId set)
const migratedLeagues = updatedLeagues as { id: string; motorsportId: string }[];

for (const league of migratedLeagues) {
  const leagueRacesPath = `leagues/${league.id}/races.json`;
  const legacyRaces = await blob.read<{ id: string; leagueId?: string; [key: string]: unknown }[]>(leagueRacesPath).then(r => r ?? []);

  if (legacyRaces.length === 0) {
    console.log(`league ${league.id}: no legacy races found`);
    continue;
  }

  const motorsportRacesPath = `motorsports/${league.motorsportId}/races.json`;
  const existingGlobal = await blob.read<{ id: string; motorsportId: string; [key: string]: unknown }[]>(motorsportRacesPath).then(r => r ?? []);
  const existingIds = new Set(existingGlobal.map(r => r.id));

  let migrated = 0;
  let skipped = 0;
  const newGlobal = [...existingGlobal];

  for (const race of legacyRaces) {
    if (existingIds.has(race.id)) {
      skipped++;
      continue;
    }
    // Strip leagueId, add motorsportId
    const { leagueId: _lid, ...rest } = race;
    newGlobal.push({ ...rest, motorsportId: league.motorsportId });
    existingIds.add(race.id);
    migrated++;
  }

  if (migrated > 0) {
    await blob.write(motorsportRacesPath, newGlobal);
    console.log(`league ${league.id}: migrated ${migrated} race(s) to motorsport ${league.motorsportId} (${skipped} already existed)`);
  } else {
    console.log(`league ${league.id}: all ${skipped} race(s) already in global path — nothing to do`);
  }
}

*/
