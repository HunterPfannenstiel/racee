/* ARCHIVED — one-off script, no longer run. Commented out so it stays excluded from typecheck/lint.

import { blob } from "../lib/blob/index.ts";

const leagues = await blob.read<{ id: string }[]>("leagues.json") ?? [];
let migrated = 0;

for (const league of leagues) {
  const pathname = `leagues/${league.id}/races.json`;
  const races = await blob.read<Record<string, unknown>[]>(pathname) ?? [];
  let changed = false;
  const updated = races.map((race) => {
    if ("racerIds" in race && !("startingGrid" in race)) {
      const { racerIds, ...rest } = race;
      changed = true;
      return { ...rest, startingGrid: racerIds };
    }
    return race;
  });
  if (changed) {
    await blob.write(pathname, updated);
    console.log("migrated:", pathname);
    migrated++;
  }
}

console.log(`done — ${migrated} file(s) updated`);

*/
