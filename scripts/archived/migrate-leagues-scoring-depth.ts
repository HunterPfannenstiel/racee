/* ARCHIVED — one-off script, no longer run. Commented out so it stays excluded from typecheck/lint.

import { blob } from "../lib/blob/index.ts";

const [leagues, racers] = await Promise.all([
  blob.read<{ id: string; scoringDepth?: number }[]>("leagues.json").then(r => r ?? []),
  blob.read<unknown[]>("racers.json").then(r => r ?? []),
]);

const depth = racers.length;
let migrated = 0;

const updated = leagues.map((league) => {
  if ("scoringDepth" in league) return league;
  migrated++;
  return { ...league, scoringDepth: depth };
});

if (migrated > 0) {
  await blob.write("leagues.json", updated);
  console.log(`migrated ${migrated} league(s) — scoringDepth set to ${depth}`);
} else {
  console.log("no leagues needed migration");
}

*/
