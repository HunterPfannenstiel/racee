/* ARCHIVED — one-off script, no longer run. Commented out so it stays excluded from typecheck/lint.

import { blob } from "../lib/blob/index.ts";

const COMMISSIONER_ID = "SrmOfH7ttqY42T5k3g11rlKgLvh5PZ5J";

const leagues = await blob.read<{ id: string; commissionerId?: string }[]>("leagues.json").then(r => r ?? []);

let migrated = 0;

const updated = leagues.map((league) => {
  if (league.commissionerId) return league;
  migrated++;
  return { ...league, commissionerId: COMMISSIONER_ID };
});

if (migrated > 0) {
  await blob.write("leagues.json", updated);
  console.log(`migrated ${migrated} league(s) — commissionerId set to ${COMMISSIONER_ID}`);
} else {
  console.log("no leagues needed migration");
}

*/
