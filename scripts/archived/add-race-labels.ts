/* ARCHIVED — one-off script, no longer run. Commented out so it stays excluded from typecheck/lint.

import { blob } from "../lib/blob/index.ts";

const LABELS: Record<string, string> = {
  "Australian Grand Prix":          "Australia",
  "Chinese Grand Prix":             "China",
  "Japanese Grand Prix":            "Japan",
  "Bahrain Grand Prix":             "Bahrain",
  "Saudi Arabian Grand Prix":       "Saudi Arabia",
  "Miami Grand Prix":               "Miami",
  "Emilia Romagna Grand Prix":      "Imola",
  "Monaco Grand Prix":              "Monaco",
  "Barcelona-Catalunya Grand Prix": "Barcelona",
  "Spanish Grand Prix":             "Spain",
  "Canadian Grand Prix":            "Canada",
  "Austrian Grand Prix":            "Austria",
  "British Grand Prix":             "British",
  "Belgian Grand Prix":             "Belgium",
  "Hungarian Grand Prix":           "Hungary",
  "Dutch Grand Prix":               "Netherlands",
  "Italian Grand Prix":             "Monza",
  "Azerbaijan Grand Prix":          "Azerbaijan",
  "Singapore Grand Prix":           "Singapore",
  "United States Grand Prix":       "US GP",
  "Mexican Grand Prix":             "Mexico",
  "Brazilian Grand Prix":           "Brazil",
  "Las Vegas Grand Prix":           "Las Vegas",
  "Qatar Grand Prix":               "Qatar",
  "Abu Dhabi Grand Prix":           "Abu Dhabi",
};

const leagues = await blob.read<{ id: string }[]>("leagues.json") ?? [];
let migrated = 0;

for (const league of leagues) {
  const pathname = `leagues/${league.id}/races.json`;
  const races = await blob.read<Record<string, unknown>[]>(pathname) ?? [];
  let changed = false;

  const updated = races.map((race) => {
    const title = race.title as string;
    if (race.label) return race;
    const label = LABELS[title];
    if (!label) {
      console.warn(`no label mapping for: "${title}"`);
      return race;
    }
    changed = true;
    return { ...race, label };
  });

  if (changed) {
    await blob.write(pathname, updated);
    console.log("updated:", pathname);
    migrated++;
  }
}

console.log(`done — ${migrated} file(s) updated`);

*/
