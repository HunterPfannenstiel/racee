// Run (local):  USE_LOCAL_BLOB=true node --env-file=.env.local --experimental-strip-types scripts/seed-2026.ts
// Run (remote): USE_LOCAL_BLOB=false node --env-file=.env.local --experimental-strip-types scripts/seed-2026.ts
// WARNING: wipes all blob storage before seeding

import { randomUUID } from "crypto";
import { rm } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { blob } from "../lib/blob/index.ts";
import { PrismaClient } from "../server/generated/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const __currentDir = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(__currentDir, "..");

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    { connectionString: process.env.DATABASE_URL! },
    { schema: process.env.DATABASE_SCHEMA }
  ),
});

// ---- Fixed user IDs (stable across seed runs — lives in Prisma) ----
const SHREK_ID    = "00000000-seed-0000-0000-000000000001";
const DONKEY_ID   = "00000000-seed-0000-0000-000000000002";
const PUSS_ID     = "00000000-seed-0000-0000-000000000003";
const FIONA_ID    = "00000000-seed-0000-0000-000000000004";
const FARQUAAD_ID = "00000000-seed-0000-0000-000000000005";
const GINGY_ID    = "00000000-seed-0000-0000-000000000006";

const users = [
  { id: SHREK_ID,    name: "Shrek" },
  { id: DONKEY_ID,   name: "Donkey" },
  { id: PUSS_ID,     name: "Puss in Boots" },
  { id: FIONA_ID,    name: "Fiona" },
  { id: FARQUAAD_ID, name: "Lord Farquaad" },
  { id: GINGY_ID,    name: "Gingy" },
];
const [shrek, donkey, puss, fiona, farquaad, gingy] = users;

// ---- Motorsport ----
const motorsportId = randomUUID();

// ---- Team Colors ----
const TEAM_COLORS: Record<string, string> = {
  "Red Bull Racing": "#1E5BC6",
  "Mercedes":        "#00D2BE",
  "Ferrari":         "#DC0000",
  "McLaren":         "#FF8000",
  "Aston Martin":    "#006F62",
  "Williams":        "#005AFF",
  "Alpine":          "#0090FF",
  "Audi":            "#C00000",
  "Haas":            "#ABABAB",
  "Racing Bulls":    "#2647D8",
  "Cadillac":        "#333333",
};

// ---- Racers ----
const racers = [
  { name: "Max Verstappen",    team: "Red Bull Racing" },
  { name: "Isack Hadjar",      team: "Red Bull Racing" },
  { name: "George Russell",    team: "Mercedes" },
  { name: "Kimi Antonelli",    team: "Mercedes" },
  { name: "Charles Leclerc",   team: "Ferrari" },
  { name: "Lewis Hamilton",    team: "Ferrari" },
  { name: "Lando Norris",      team: "McLaren" },
  { name: "Oscar Piastri",     team: "McLaren" },
  { name: "Fernando Alonso",   team: "Aston Martin" },
  { name: "Lance Stroll",      team: "Aston Martin" },
  { name: "Alex Albon",        team: "Williams" },
  { name: "Carlos Sainz Jr.", team: "Williams" },
  { name: "Pierre Gasly",      team: "Alpine" },
  { name: "Franco Colapinto",  team: "Alpine" },
  { name: "Gabriel Bortoleto", team: "Audi" },
  { name: "Nico Hulkenberg",   team: "Audi" },
  { name: "Esteban Ocon",      team: "Haas" },
  { name: "Oliver Bearman",    team: "Haas" },
  { name: "Liam Lawson",       team: "Racing Bulls" },
  { name: "Arvid Lindblad",    team: "Racing Bulls" },
  { name: "Sergio Perez",      team: "Cadillac" },
  { name: "Valtteri Bottas",   team: "Cadillac" },
].map(r => ({ id: randomUUID(), name: r.name, team: r.team, teamColor: TEAM_COLORS[r.team], motorsportId }));

const R: Record<string, string> = Object.fromEntries(racers.map(r => [r.name, r.id]));
const allRacerIds = racers.map(r => r.id);

// ---- League ----
const leagueId = randomUUID();
const PLACEMENT_POINTS = [10, 7, 3];
const MULLIGAN_COUNT = 2;
// Weekly team points by finish rank — bottom 2 always earn 0
const TEAM_POSITION_POINTS = [6, 5, 4, 3, 0, 0];
const PROP_POINT_VALUES = {
  driverOfDay: 5,
  lapsLed: 5,
  fastestPitStop: 5,
  fastestLap: 5,
  overAchiever: 5,
  underAchiever: 5,
  wrecker: 5,
};

// ---- League Teams ----
const leagueTeams = [
  { id: randomUUID(), name: "Swamp Dwellers", color: "#6B8E23", memberIds: [shrek.id, donkey.id, puss.id] },
  { id: randomUUID(), name: "Far Far Away",   color: "#9B59B6", memberIds: [fiona.id, farquaad.id, gingy.id] },
];
// teamId lookup for scoring
const teamMembership = new Map<string, string>();
for (const team of leagueTeams) {
  for (const userId of team.memberIds) teamMembership.set(userId, team.id);
}
const activeTeamIds = new Set<string>(leagueTeams.map(t => t.id));

// ---- Races ----
const NOW = new Date().toISOString();
const GRADED_RACE_KEYS = ["australian", "chinese", "japanese", "miami"] as const;
type RaceKey = typeof GRADED_RACE_KEYS[number];

const raceDefinitions = [
  { title: "Australian Grand Prix",          date: "2026-03-08" },
  { title: "Chinese Grand Prix",             date: "2026-03-15" },
  { title: "Japanese Grand Prix",            date: "2026-03-29" },
  { title: "Miami Grand Prix",               date: "2026-05-03" },
  { title: "Canadian Grand Prix",            date: "2026-05-24" },
  { title: "Monaco Grand Prix",              date: "2026-06-07" },
  { title: "Barcelona-Catalunya Grand Prix", date: "2026-06-14" },
  { title: "Austrian Grand Prix",            date: "2026-06-28" },
  { title: "British Grand Prix",             date: "2026-07-05" },
  { title: "Belgian Grand Prix",             date: "2026-07-19" },
  { title: "Hungarian Grand Prix",           date: "2026-07-26" },
  { title: "Dutch Grand Prix",               date: "2026-08-23" },
  { title: "Italian Grand Prix",             date: "2026-09-06" },
  { title: "Spanish Grand Prix",             date: "2026-09-13" },
  { title: "Azerbaijan Grand Prix",          date: "2026-09-26" },
  { title: "Singapore Grand Prix",           date: "2026-10-11" },
  { title: "United States Grand Prix",       date: "2026-10-25" },
  { title: "Mexican Grand Prix",             date: "2026-11-01" },
  { title: "Brazilian Grand Prix",           date: "2026-11-08" },
  { title: "Las Vegas Grand Prix",           date: "2026-11-22" },
  { title: "Qatar Grand Prix",               date: "2026-11-29" },
  { title: "Abu Dhabi Grand Prix",           date: "2026-12-06" },
];

const titleToKey: Record<string, RaceKey> = {
  "Australian Grand Prix": "australian",
  "Chinese Grand Prix":    "chinese",
  "Japanese Grand Prix":   "japanese",
  "Miami Grand Prix":      "miami",
};

// ---- Actual finishing orders ----
const ACTUAL: Record<RaceKey, string[]> = {
  australian: [
    R["George Russell"],    R["Kimi Antonelli"],    R["Charles Leclerc"],  R["Lewis Hamilton"],
    R["Lando Norris"],      R["Max Verstappen"],    R["Oliver Bearman"],   R["Arvid Lindblad"],
    R["Gabriel Bortoleto"], R["Pierre Gasly"],      R["Esteban Ocon"],     R["Alex Albon"],
    R["Liam Lawson"],       R["Franco Colapinto"],  R["Carlos Sainz Jr."], R["Sergio Perez"],
    R["Lance Stroll"],      R["Fernando Alonso"],   R["Valtteri Bottas"],  R["Isack Hadjar"],
    R["Oscar Piastri"],     R["Nico Hulkenberg"],
  ],
  chinese: [
    R["Kimi Antonelli"],   R["George Russell"],    R["Lewis Hamilton"],    R["Charles Leclerc"],
    R["Oliver Bearman"],   R["Pierre Gasly"],      R["Liam Lawson"],       R["Isack Hadjar"],
    R["Carlos Sainz Jr."], R["Franco Colapinto"],  R["Nico Hulkenberg"],   R["Arvid Lindblad"],
    R["Valtteri Bottas"],  R["Esteban Ocon"],      R["Sergio Perez"],      R["Fernando Alonso"],
    R["Lance Stroll"],     R["Alex Albon"],         R["Gabriel Bortoleto"],R["Max Verstappen"],
    R["Oscar Piastri"],    R["Lando Norris"],
  ],
  japanese: [
    R["Kimi Antonelli"],   R["Oscar Piastri"],     R["Charles Leclerc"],  R["George Russell"],
    R["Lando Norris"],     R["Lewis Hamilton"],    R["Pierre Gasly"],     R["Max Verstappen"],
    R["Liam Lawson"],      R["Esteban Ocon"],      R["Nico Hulkenberg"],  R["Isack Hadjar"],
    R["Gabriel Bortoleto"],R["Arvid Lindblad"],    R["Carlos Sainz Jr."], R["Franco Colapinto"],
    R["Sergio Perez"],     R["Fernando Alonso"],   R["Valtteri Bottas"],  R["Alex Albon"],
    R["Lance Stroll"],     R["Oliver Bearman"],
  ],
  miami: [
    R["Kimi Antonelli"],   R["Lando Norris"],      R["Oscar Piastri"],    R["George Russell"],
    R["Max Verstappen"],   R["Lewis Hamilton"],    R["Franco Colapinto"], R["Charles Leclerc"],
    R["Carlos Sainz Jr."], R["Alex Albon"],         R["Oliver Bearman"],   R["Gabriel Bortoleto"],
    R["Esteban Ocon"],     R["Arvid Lindblad"],    R["Fernando Alonso"],  R["Sergio Perez"],
    R["Lance Stroll"],     R["Valtteri Bottas"],   R["Nico Hulkenberg"],  R["Liam Lawson"],
    R["Pierre Gasly"],     R["Isack Hadjar"],
  ],
};

// ---- Prop keys ----
const PROP_KEYS: Record<RaceKey, Record<string, string[]>> = {
  australian: {
    lapsLed:        [R["George Russell"]],
    fastestLap:     [R["Lando Norris"]],
    driverOfDay:    [R["Oliver Bearman"]],
    fastestPitStop: ["Mercedes"],
    overAchiever:   [R["Oliver Bearman"]],
    underAchiever:  [R["Fernando Alonso"]],
    wrecker:        [R["Isack Hadjar"]],
  },
  chinese: {
    lapsLed:        [R["Kimi Antonelli"]],
    fastestLap:     [R["George Russell"]],
    driverOfDay:    [R["Oliver Bearman"]],
    fastestPitStop: ["Ferrari"],
    overAchiever:   [R["Oliver Bearman"]],
    underAchiever:  [R["Lando Norris"]],
    wrecker:        [R["Max Verstappen"]],
  },
  japanese: {
    lapsLed:        [R["Kimi Antonelli"]],
    fastestLap:     [R["Lando Norris"]],
    driverOfDay:    [R["Oscar Piastri"]],
    fastestPitStop: ["McLaren"],
    overAchiever:   [R["Pierre Gasly"]],
    underAchiever:  [R["Max Verstappen"]],
    wrecker:        [R["Lance Stroll"]],
  },
  miami: {
    lapsLed:        [R["Kimi Antonelli"]],
    fastestLap:     [R["Max Verstappen"]],
    driverOfDay:    [R["Franco Colapinto"]],
    fastestPitStop: ["McLaren"],
    overAchiever:   [R["Franco Colapinto"]],
    underAchiever:  [R["Charles Leclerc"]],
    wrecker:        [R["Pierre Gasly"]],
  },
};

// ---- Predictions ----
type PropPicks = Record<string, string>;
type UserPrediction = { order: string[]; props: PropPicks };
const PREDICTIONS: Record<RaceKey, Record<string, UserPrediction>> = {
  australian: {
    [fiona.id]: {
      order: [R["George Russell"], R["Kimi Antonelli"], R["Charles Leclerc"], R["Lewis Hamilton"],
              R["Lando Norris"], R["Max Verstappen"], R["Oliver Bearman"], R["Oscar Piastri"],
              R["Fernando Alonso"], R["Pierre Gasly"], R["Carlos Sainz Jr."], R["Arvid Lindblad"],
              R["Esteban Ocon"], R["Gabriel Bortoleto"], R["Franco Colapinto"], R["Alex Albon"],
              R["Liam Lawson"], R["Valtteri Bottas"], R["Sergio Perez"], R["Lance Stroll"],
              R["Isack Hadjar"], R["Nico Hulkenberg"]],
      props: { lapsLed: R["George Russell"], fastestLap: R["Lando Norris"], driverOfDay: R["Oliver Bearman"],
               fastestPitStop: "Mercedes", overAchiever: R["Oliver Bearman"],
               underAchiever: R["Fernando Alonso"], wrecker: R["Isack Hadjar"] },
    },
    [shrek.id]: {
      order: [R["George Russell"], R["Charles Leclerc"], R["Kimi Antonelli"], R["Lewis Hamilton"],
              R["Lando Norris"], R["Max Verstappen"], R["Oscar Piastri"], R["Oliver Bearman"],
              R["Fernando Alonso"], R["Pierre Gasly"], R["Arvid Lindblad"], R["Gabriel Bortoleto"],
              R["Esteban Ocon"], R["Carlos Sainz Jr."], R["Franco Colapinto"], R["Alex Albon"],
              R["Liam Lawson"], R["Lance Stroll"], R["Sergio Perez"], R["Valtteri Bottas"],
              R["Isack Hadjar"], R["Nico Hulkenberg"]],
      props: { lapsLed: R["George Russell"], fastestLap: R["Lando Norris"], driverOfDay: R["Arvid Lindblad"],
               fastestPitStop: "Mercedes", overAchiever: R["Arvid Lindblad"],
               underAchiever: R["Fernando Alonso"], wrecker: R["Valtteri Bottas"] },
    },
    [farquaad.id]: {
      order: [R["Kimi Antonelli"], R["George Russell"], R["Lewis Hamilton"], R["Charles Leclerc"],
              R["Max Verstappen"], R["Lando Norris"], R["Oliver Bearman"], R["Arvid Lindblad"],
              R["Pierre Gasly"], R["Gabriel Bortoleto"], R["Esteban Ocon"], R["Alex Albon"],
              R["Liam Lawson"], R["Franco Colapinto"], R["Carlos Sainz Jr."], R["Sergio Perez"],
              R["Lance Stroll"], R["Fernando Alonso"], R["Valtteri Bottas"], R["Isack Hadjar"],
              R["Oscar Piastri"], R["Nico Hulkenberg"]],
      props: { lapsLed: R["George Russell"], fastestLap: R["Charles Leclerc"], driverOfDay: R["Arvid Lindblad"],
               fastestPitStop: "Mercedes", overAchiever: R["Oliver Bearman"],
               underAchiever: R["Lance Stroll"], wrecker: R["Valtteri Bottas"] },
    },
    [donkey.id]: {
      order: [R["George Russell"], R["Kimi Antonelli"], R["Lewis Hamilton"], R["Charles Leclerc"],
              R["Max Verstappen"], R["Lando Norris"], R["Pierre Gasly"], R["Gabriel Bortoleto"],
              R["Esteban Ocon"], R["Oliver Bearman"], R["Alex Albon"], R["Carlos Sainz Jr."],
              R["Arvid Lindblad"], R["Franco Colapinto"], R["Fernando Alonso"], R["Sergio Perez"],
              R["Lance Stroll"], R["Valtteri Bottas"], R["Liam Lawson"], R["Isack Hadjar"],
              R["Oscar Piastri"], R["Nico Hulkenberg"]],
      props: { lapsLed: R["George Russell"], fastestLap: R["Max Verstappen"], driverOfDay: R["Pierre Gasly"],
               fastestPitStop: "Ferrari", overAchiever: R["Gabriel Bortoleto"],
               underAchiever: R["Lance Stroll"], wrecker: R["Valtteri Bottas"] },
    },
    [puss.id]: {
      order: [R["Lando Norris"], R["George Russell"], R["Kimi Antonelli"], R["Charles Leclerc"],
              R["Lewis Hamilton"], R["Max Verstappen"], R["Oscar Piastri"], R["Pierre Gasly"],
              R["Fernando Alonso"], R["Oliver Bearman"], R["Esteban Ocon"], R["Alex Albon"],
              R["Arvid Lindblad"], R["Gabriel Bortoleto"], R["Carlos Sainz Jr."], R["Liam Lawson"],
              R["Franco Colapinto"], R["Sergio Perez"], R["Lance Stroll"], R["Valtteri Bottas"],
              R["Isack Hadjar"], R["Nico Hulkenberg"]],
      props: { lapsLed: R["Lando Norris"], fastestLap: R["Kimi Antonelli"], driverOfDay: R["Fernando Alonso"],
               fastestPitStop: "Ferrari", overAchiever: R["Pierre Gasly"],
               underAchiever: R["Nico Hulkenberg"], wrecker: R["Lance Stroll"] },
    },
    [gingy.id]: {
      order: [R["Max Verstappen"], R["Lando Norris"], R["Oscar Piastri"], R["Charles Leclerc"],
              R["Lewis Hamilton"], R["George Russell"], R["Kimi Antonelli"], R["Fernando Alonso"],
              R["Pierre Gasly"], R["Gabriel Bortoleto"], R["Lance Stroll"], R["Alex Albon"],
              R["Esteban Ocon"], R["Carlos Sainz Jr."], R["Franco Colapinto"], R["Liam Lawson"],
              R["Sergio Perez"], R["Valtteri Bottas"], R["Nico Hulkenberg"], R["Arvid Lindblad"],
              R["Isack Hadjar"], R["Oliver Bearman"]],
      props: { lapsLed: R["Max Verstappen"], fastestLap: R["Oscar Piastri"], driverOfDay: R["Fernando Alonso"],
               fastestPitStop: "Red Bull Racing", overAchiever: R["Lance Stroll"],
               underAchiever: R["George Russell"], wrecker: R["Carlos Sainz Jr."] },
    },
  },

  chinese: {
    [fiona.id]: {
      order: [R["Kimi Antonelli"], R["George Russell"], R["Lewis Hamilton"], R["Charles Leclerc"],
              R["Oliver Bearman"], R["Pierre Gasly"], R["Liam Lawson"], R["Isack Hadjar"],
              R["Carlos Sainz Jr."], R["Franco Colapinto"], R["Nico Hulkenberg"], R["Arvid Lindblad"],
              R["Valtteri Bottas"], R["Esteban Ocon"], R["Sergio Perez"], R["Fernando Alonso"],
              R["Lance Stroll"], R["Alex Albon"], R["Gabriel Bortoleto"], R["Max Verstappen"],
              R["Oscar Piastri"], R["Lando Norris"]],
      props: { lapsLed: R["Kimi Antonelli"], fastestLap: R["George Russell"], driverOfDay: R["Oliver Bearman"],
               fastestPitStop: "Ferrari", overAchiever: R["Oliver Bearman"],
               underAchiever: R["Lando Norris"], wrecker: R["Max Verstappen"] },
    },
    [shrek.id]: {
      order: [R["Kimi Antonelli"], R["George Russell"], R["Charles Leclerc"], R["Lewis Hamilton"],
              R["Lando Norris"], R["Oliver Bearman"], R["Pierre Gasly"], R["Isack Hadjar"],
              R["Liam Lawson"], R["Carlos Sainz Jr."], R["Nico Hulkenberg"], R["Arvid Lindblad"],
              R["Franco Colapinto"], R["Esteban Ocon"], R["Sergio Perez"], R["Fernando Alonso"],
              R["Alex Albon"], R["Lance Stroll"], R["Gabriel Bortoleto"], R["Max Verstappen"],
              R["Valtteri Bottas"], R["Oscar Piastri"]],
      props: { lapsLed: R["Kimi Antonelli"], fastestLap: R["George Russell"], driverOfDay: R["Liam Lawson"],
               fastestPitStop: "Mercedes", overAchiever: R["Oliver Bearman"],
               underAchiever: R["Lando Norris"], wrecker: R["Valtteri Bottas"] },
    },
    [farquaad.id]: {
      order: [R["George Russell"], R["Kimi Antonelli"], R["Lewis Hamilton"], R["Charles Leclerc"],
              R["Max Verstappen"], R["Pierre Gasly"], R["Oliver Bearman"], R["Liam Lawson"],
              R["Isack Hadjar"], R["Carlos Sainz Jr."], R["Arvid Lindblad"], R["Nico Hulkenberg"],
              R["Esteban Ocon"], R["Franco Colapinto"], R["Valtteri Bottas"], R["Sergio Perez"],
              R["Fernando Alonso"], R["Alex Albon"], R["Gabriel Bortoleto"], R["Lance Stroll"],
              R["Oscar Piastri"], R["Lando Norris"]],
      props: { lapsLed: R["Kimi Antonelli"], fastestLap: R["Kimi Antonelli"], driverOfDay: R["Liam Lawson"],
               fastestPitStop: "Mercedes", overAchiever: R["Pierre Gasly"],
               underAchiever: R["Max Verstappen"], wrecker: R["Max Verstappen"] },
    },
    [donkey.id]: {
      order: [R["George Russell"], R["Kimi Antonelli"], R["Lewis Hamilton"], R["Oliver Bearman"],
              R["Charles Leclerc"], R["Pierre Gasly"], R["Max Verstappen"], R["Liam Lawson"],
              R["Carlos Sainz Jr."], R["Isack Hadjar"], R["Nico Hulkenberg"], R["Esteban Ocon"],
              R["Arvid Lindblad"], R["Franco Colapinto"], R["Valtteri Bottas"], R["Sergio Perez"],
              R["Fernando Alonso"], R["Alex Albon"], R["Gabriel Bortoleto"], R["Lance Stroll"],
              R["Oscar Piastri"], R["Lando Norris"]],
      props: { lapsLed: R["George Russell"], fastestLap: R["Lewis Hamilton"], driverOfDay: R["Oliver Bearman"],
               fastestPitStop: "Ferrari", overAchiever: R["Isack Hadjar"],
               underAchiever: R["Lando Norris"], wrecker: R["Lance Stroll"] },
    },
    [puss.id]: {
      order: [R["Kimi Antonelli"], R["Lewis Hamilton"], R["George Russell"], R["Oscar Piastri"],
              R["Charles Leclerc"], R["Lando Norris"], R["Oliver Bearman"], R["Pierre Gasly"],
              R["Max Verstappen"], R["Liam Lawson"], R["Carlos Sainz Jr."], R["Arvid Lindblad"],
              R["Nico Hulkenberg"], R["Esteban Ocon"], R["Franco Colapinto"], R["Sergio Perez"],
              R["Isack Hadjar"], R["Valtteri Bottas"], R["Fernando Alonso"], R["Alex Albon"],
              R["Gabriel Bortoleto"], R["Lance Stroll"]],
      props: { lapsLed: R["Kimi Antonelli"], fastestLap: R["Lewis Hamilton"], driverOfDay: R["Pierre Gasly"],
               fastestPitStop: "Mercedes", overAchiever: R["Oliver Bearman"],
               underAchiever: R["Oscar Piastri"], wrecker: R["Lance Stroll"] },
    },
    [gingy.id]: {
      order: [R["Max Verstappen"], R["Lando Norris"], R["Oscar Piastri"], R["George Russell"],
              R["Kimi Antonelli"], R["Lewis Hamilton"], R["Charles Leclerc"], R["Fernando Alonso"],
              R["Lance Stroll"], R["Pierre Gasly"], R["Alex Albon"], R["Esteban Ocon"],
              R["Gabriel Bortoleto"], R["Nico Hulkenberg"], R["Carlos Sainz Jr."], R["Arvid Lindblad"],
              R["Liam Lawson"], R["Franco Colapinto"], R["Valtteri Bottas"], R["Sergio Perez"],
              R["Isack Hadjar"], R["Oliver Bearman"]],
      props: { lapsLed: R["Max Verstappen"], fastestLap: R["Lando Norris"], driverOfDay: R["Fernando Alonso"],
               fastestPitStop: "Red Bull Racing", overAchiever: R["Lance Stroll"],
               underAchiever: R["George Russell"], wrecker: R["Oscar Piastri"] },
    },
  },

  japanese: {
    [fiona.id]: {
      order: [R["Kimi Antonelli"], R["Oscar Piastri"], R["Charles Leclerc"], R["George Russell"],
              R["Lando Norris"], R["Lewis Hamilton"], R["Pierre Gasly"], R["Max Verstappen"],
              R["Liam Lawson"], R["Esteban Ocon"], R["Nico Hulkenberg"], R["Isack Hadjar"],
              R["Gabriel Bortoleto"], R["Arvid Lindblad"], R["Carlos Sainz Jr."], R["Franco Colapinto"],
              R["Sergio Perez"], R["Fernando Alonso"], R["Valtteri Bottas"], R["Alex Albon"],
              R["Lance Stroll"], R["Oliver Bearman"]],
      props: { lapsLed: R["Kimi Antonelli"], fastestLap: R["Lando Norris"], driverOfDay: R["Oscar Piastri"],
               fastestPitStop: "McLaren", overAchiever: R["Pierre Gasly"],
               underAchiever: R["Max Verstappen"], wrecker: R["Lance Stroll"] },
    },
    [shrek.id]: {
      order: [R["Kimi Antonelli"], R["George Russell"], R["Charles Leclerc"], R["Oscar Piastri"],
              R["Lando Norris"], R["Lewis Hamilton"], R["Max Verstappen"], R["Pierre Gasly"],
              R["Liam Lawson"], R["Esteban Ocon"], R["Isack Hadjar"], R["Nico Hulkenberg"],
              R["Arvid Lindblad"], R["Gabriel Bortoleto"], R["Carlos Sainz Jr."], R["Fernando Alonso"],
              R["Franco Colapinto"], R["Sergio Perez"], R["Valtteri Bottas"], R["Alex Albon"],
              R["Oliver Bearman"], R["Lance Stroll"]],
      props: { lapsLed: R["Kimi Antonelli"], fastestLap: R["Lando Norris"], driverOfDay: R["Oscar Piastri"],
               fastestPitStop: "McLaren", overAchiever: R["Pierre Gasly"],
               underAchiever: R["Max Verstappen"], wrecker: R["Oliver Bearman"] },
    },
    [farquaad.id]: {
      order: [R["Kimi Antonelli"], R["Oscar Piastri"], R["Lando Norris"], R["Charles Leclerc"],
              R["George Russell"], R["Lewis Hamilton"], R["Max Verstappen"], R["Pierre Gasly"],
              R["Isack Hadjar"], R["Esteban Ocon"], R["Nico Hulkenberg"], R["Liam Lawson"],
              R["Gabriel Bortoleto"], R["Arvid Lindblad"], R["Franco Colapinto"], R["Carlos Sainz Jr."],
              R["Sergio Perez"], R["Fernando Alonso"], R["Alex Albon"], R["Valtteri Bottas"],
              R["Lance Stroll"], R["Oliver Bearman"]],
      props: { lapsLed: R["Kimi Antonelli"], fastestLap: R["Lando Norris"], driverOfDay: R["Oscar Piastri"],
               fastestPitStop: "Mercedes", overAchiever: R["Pierre Gasly"],
               underAchiever: R["Isack Hadjar"], wrecker: R["Oliver Bearman"] },
    },
    [donkey.id]: {
      order: [R["Kimi Antonelli"], R["Charles Leclerc"], R["Oscar Piastri"], R["George Russell"],
              R["Lewis Hamilton"], R["Lando Norris"], R["Max Verstappen"], R["Esteban Ocon"],
              R["Pierre Gasly"], R["Liam Lawson"], R["Isack Hadjar"], R["Nico Hulkenberg"],
              R["Gabriel Bortoleto"], R["Arvid Lindblad"], R["Carlos Sainz Jr."], R["Franco Colapinto"],
              R["Fernando Alonso"], R["Sergio Perez"], R["Alex Albon"], R["Valtteri Bottas"],
              R["Lance Stroll"], R["Oliver Bearman"]],
      props: { lapsLed: R["Kimi Antonelli"], fastestLap: R["Max Verstappen"], driverOfDay: R["Liam Lawson"],
               fastestPitStop: "McLaren", overAchiever: R["Esteban Ocon"],
               underAchiever: R["Max Verstappen"], wrecker: R["Lance Stroll"] },
    },
    [puss.id]: {
      order: [R["Oscar Piastri"], R["Kimi Antonelli"], R["Lando Norris"], R["Charles Leclerc"],
              R["George Russell"], R["Lewis Hamilton"], R["Max Verstappen"], R["Pierre Gasly"],
              R["Liam Lawson"], R["Isack Hadjar"], R["Esteban Ocon"], R["Gabriel Bortoleto"],
              R["Nico Hulkenberg"], R["Arvid Lindblad"], R["Franco Colapinto"], R["Carlos Sainz Jr."],
              R["Alex Albon"], R["Sergio Perez"], R["Fernando Alonso"], R["Valtteri Bottas"],
              R["Oliver Bearman"], R["Lance Stroll"]],
      props: { lapsLed: R["Kimi Antonelli"], fastestLap: R["Lando Norris"], driverOfDay: R["Pierre Gasly"],
               fastestPitStop: "McLaren", overAchiever: R["Pierre Gasly"],
               underAchiever: R["Max Verstappen"], wrecker: R["Oliver Bearman"] },
    },
    [gingy.id]: {
      order: [R["Max Verstappen"], R["Lando Norris"], R["George Russell"], R["Oscar Piastri"],
              R["Kimi Antonelli"], R["Charles Leclerc"], R["Lewis Hamilton"], R["Fernando Alonso"],
              R["Lance Stroll"], R["Pierre Gasly"], R["Alex Albon"], R["Esteban Ocon"],
              R["Gabriel Bortoleto"], R["Nico Hulkenberg"], R["Carlos Sainz Jr."], R["Isack Hadjar"],
              R["Liam Lawson"], R["Franco Colapinto"], R["Valtteri Bottas"], R["Sergio Perez"],
              R["Arvid Lindblad"], R["Oliver Bearman"]],
      props: { lapsLed: R["Max Verstappen"], fastestLap: R["Max Verstappen"], driverOfDay: R["Lance Stroll"],
               fastestPitStop: "Red Bull Racing", overAchiever: R["Fernando Alonso"],
               underAchiever: R["George Russell"], wrecker: R["Valtteri Bottas"] },
    },
  },

  miami: {
    [fiona.id]: {
      order: [R["Kimi Antonelli"], R["Lando Norris"], R["Oscar Piastri"], R["George Russell"],
              R["Max Verstappen"], R["Lewis Hamilton"], R["Franco Colapinto"], R["Charles Leclerc"],
              R["Carlos Sainz Jr."], R["Alex Albon"], R["Oliver Bearman"], R["Gabriel Bortoleto"],
              R["Esteban Ocon"], R["Arvid Lindblad"], R["Fernando Alonso"], R["Sergio Perez"],
              R["Lance Stroll"], R["Valtteri Bottas"], R["Nico Hulkenberg"], R["Liam Lawson"],
              R["Pierre Gasly"], R["Isack Hadjar"]],
      props: { lapsLed: R["Kimi Antonelli"], fastestLap: R["Max Verstappen"], driverOfDay: R["Franco Colapinto"],
               fastestPitStop: "McLaren", overAchiever: R["Franco Colapinto"],
               underAchiever: R["Charles Leclerc"], wrecker: R["Pierre Gasly"] },
    },
    [shrek.id]: {
      order: [R["Kimi Antonelli"], R["Lando Norris"], R["Oscar Piastri"], R["George Russell"],
              R["Lewis Hamilton"], R["Max Verstappen"], R["Charles Leclerc"], R["Franco Colapinto"],
              R["Carlos Sainz Jr."], R["Alex Albon"], R["Oliver Bearman"], R["Esteban Ocon"],
              R["Gabriel Bortoleto"], R["Arvid Lindblad"], R["Fernando Alonso"], R["Sergio Perez"],
              R["Lance Stroll"], R["Valtteri Bottas"], R["Nico Hulkenberg"], R["Liam Lawson"],
              R["Pierre Gasly"], R["Isack Hadjar"]],
      props: { lapsLed: R["Kimi Antonelli"], fastestLap: R["Lando Norris"], driverOfDay: R["Franco Colapinto"],
               fastestPitStop: "McLaren", overAchiever: R["Alex Albon"],
               underAchiever: R["Charles Leclerc"], wrecker: R["Liam Lawson"] },
    },
    [farquaad.id]: {
      order: [R["Kimi Antonelli"], R["Oscar Piastri"], R["Lando Norris"], R["George Russell"],
              R["Max Verstappen"], R["Lewis Hamilton"], R["Franco Colapinto"], R["Charles Leclerc"],
              R["Carlos Sainz Jr."], R["Alex Albon"], R["Oliver Bearman"], R["Gabriel Bortoleto"],
              R["Esteban Ocon"], R["Arvid Lindblad"], R["Fernando Alonso"], R["Sergio Perez"],
              R["Lance Stroll"], R["Valtteri Bottas"], R["Nico Hulkenberg"], R["Liam Lawson"],
              R["Pierre Gasly"], R["Isack Hadjar"]],
      props: { lapsLed: R["Kimi Antonelli"], fastestLap: R["Max Verstappen"], driverOfDay: R["Franco Colapinto"],
               fastestPitStop: "McLaren", overAchiever: R["Franco Colapinto"],
               underAchiever: R["Charles Leclerc"], wrecker: R["Pierre Gasly"] },
    },
    [donkey.id]: {
      // Identical to Farquaad — engineers a 2-way cross-team tie at weekly positions 2-3,
      // demonstrating the pool-split mechanic: both get (5+4)/2 = 4.5 team points
      order: [R["Kimi Antonelli"], R["Oscar Piastri"], R["Lando Norris"], R["George Russell"],
              R["Max Verstappen"], R["Lewis Hamilton"], R["Franco Colapinto"], R["Charles Leclerc"],
              R["Carlos Sainz Jr."], R["Alex Albon"], R["Oliver Bearman"], R["Gabriel Bortoleto"],
              R["Esteban Ocon"], R["Arvid Lindblad"], R["Fernando Alonso"], R["Sergio Perez"],
              R["Lance Stroll"], R["Valtteri Bottas"], R["Nico Hulkenberg"], R["Liam Lawson"],
              R["Pierre Gasly"], R["Isack Hadjar"]],
      props: { lapsLed: R["Kimi Antonelli"], fastestLap: R["Max Verstappen"], driverOfDay: R["Franco Colapinto"],
               fastestPitStop: "McLaren", overAchiever: R["Franco Colapinto"],
               underAchiever: R["Charles Leclerc"], wrecker: R["Pierre Gasly"] },
    },
    [puss.id]: {
      order: [R["Kimi Antonelli"], R["Lando Norris"], R["George Russell"], R["Oscar Piastri"],
              R["Max Verstappen"], R["Charles Leclerc"], R["Lewis Hamilton"], R["Franco Colapinto"],
              R["Alex Albon"], R["Carlos Sainz Jr."], R["Oliver Bearman"], R["Gabriel Bortoleto"],
              R["Esteban Ocon"], R["Fernando Alonso"], R["Arvid Lindblad"], R["Lance Stroll"],
              R["Sergio Perez"], R["Valtteri Bottas"], R["Nico Hulkenberg"], R["Liam Lawson"],
              R["Pierre Gasly"], R["Isack Hadjar"]],
      props: { lapsLed: R["Kimi Antonelli"], fastestLap: R["Lando Norris"], driverOfDay: R["Alex Albon"],
               fastestPitStop: "Mercedes", overAchiever: R["Franco Colapinto"],
               underAchiever: R["Max Verstappen"], wrecker: R["Pierre Gasly"] },
    },
    [gingy.id]: {
      order: [R["Max Verstappen"], R["Lando Norris"], R["Charles Leclerc"], R["Oscar Piastri"],
              R["George Russell"], R["Kimi Antonelli"], R["Lewis Hamilton"], R["Fernando Alonso"],
              R["Carlos Sainz Jr."], R["Alex Albon"], R["Oliver Bearman"], R["Lance Stroll"],
              R["Esteban Ocon"], R["Gabriel Bortoleto"], R["Arvid Lindblad"], R["Sergio Perez"],
              R["Franco Colapinto"], R["Valtteri Bottas"], R["Nico Hulkenberg"], R["Isack Hadjar"],
              R["Pierre Gasly"], R["Liam Lawson"]],
      props: { lapsLed: R["Max Verstappen"], fastestLap: R["Charles Leclerc"], driverOfDay: R["Fernando Alonso"],
               fastestPitStop: "Red Bull Racing", overAchiever: R["Lance Stroll"],
               underAchiever: R["Kimi Antonelli"], wrecker: R["Liam Lawson"] },
    },
  },
};

// ---- Inlined scoring helpers (same logic as lib/scoring.ts, no @/ import needed) ----
function computeGridPoints(userOrder: string[], keyOrder: string[], placementPoints: number[], scoringDepth?: number): number {
  const depth = scoringDepth ?? keyOrder.length;
  let total = 0;
  for (let keyPos = 0; keyPos < keyOrder.length; keyPos++) {
    const racerId = keyOrder[keyPos];
    const userPos = userOrder.indexOf(racerId);
    if (userPos === -1) continue;
    if (userPos >= depth) continue;
    const diff = Math.abs(keyPos - userPos);
    total += diff < placementPoints.length ? placementPoints[diff] : 0;
  }
  return total;
}

function computePropPoints(picks: Record<string, string>, propKey: Record<string, string[] | null>, propPointValues: Record<string, number>): number {
  let total = 0;
  for (const [prop, winners] of Object.entries(propKey)) {
    if (!winners || winners.length === 0) continue;
    if (winners.includes(picks[prop])) total += propPointValues[prop] ?? 0;
  }
  return total;
}

function computeWeeklyTeamPoints(
  entries: { userId: string; total: number }[],
  positionPoints: number[],
): Map<string, number> {
  const sorted = [...entries].sort((a, b) => b.total - a.total);
  const result = new Map<string, number>();
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j < sorted.length && sorted[j].total === sorted[i].total) j++;
    const pool = positionPoints.slice(i, j).reduce((sum, v) => sum + v, 0);
    const share = pool / (j - i);
    for (let k = i; k < j; k++) result.set(sorted[k].userId, share);
    i = j;
  }
  return result;
}

function assignMedals(entries: { userId: string; gridPoints: number; propPoints: number }[]) {
  const totalPts = (e: { gridPoints: number; propPoints: number }) => e.gridPoints + e.propPoints;
  const sorted = [...entries].sort((a, b) => totalPts(b) - totalPts(a));
  const medals: (string | null)[] = new Array(sorted.length).fill(null);
  const podium = ["gold", "silver", "bronze"];
  let podiumIdx = 0;
  let i = 0;
  while (i < sorted.length && podiumIdx < podium.length) {
    const score = totalPts(sorted[i]);
    let j = i;
    while (j < sorted.length && totalPts(sorted[j]) === score) {
      medals[j] = podium[podiumIdx];
      j++;
    }
    podiumIdx++;
    i = j;
  }
  return sorted.map((entry, idx) => ({ ...entry, medal: medals[idx] as "gold" | "silver" | "bronze" | null }));
}

// ---- Wipe ----
async function wipeStorage() {
  console.log("Wiping blob storage...");
  if (process.env.USE_LOCAL_BLOB === "true") {
    await rm(join(APP_DIR, ".blob-store"), { recursive: true, force: true });
  } else {
    const { list, del } = await import("@vercel/blob");
    let cursor: string | undefined;
    do {
      const result = await list({ cursor, limit: 1000 });
      if (result.blobs.length > 0) await del(result.blobs.map(b => b.url));
      cursor = result.cursor;
    } while (cursor);
  }
  console.log("  Done");
}

// ============================================================
// Main
// ============================================================

await wipeStorage();

// 1. Users (Prisma — upsert so re-runs are safe)
console.log("Seeding users...");
for (const user of users) {
  await prisma.user.upsert({
    where: { id: user.id },
    update: { name: user.name },
    create: { id: user.id, name: user.name, emailVerified: false, isAdmin: false },
  });
  console.log(`  ✓ ${user.name}`);
}

// 2. Motorsport
console.log("Seeding motorsport...");
await blob.write("motorsports.json", [{ id: motorsportId, name: "Formula 1", slug: "f1" }]);
console.log(`  ✓ Formula 1 (${motorsportId})`);

// 3. Racers
console.log("Seeding racers...");
await blob.write("racers.json", racers);
console.log(`  ✓ ${racers.length} racers`);

// 4. Races (build with keys for already-graded rounds)
console.log("Seeding races...");
const races = raceDefinitions.map(def => {
  const key = titleToKey[def.title] as RaceKey | undefined;
  return {
    id: randomUUID(),
    motorsportId,
    title: def.title,
    date: def.date,
    lockTime: `${def.date}T13:55:00.000Z`,
    startingGrid: allRacerIds,
    keyOrder: key ? ACTUAL[key] : null,
    propKey: key ? PROP_KEYS[key] : null,
    keySetAt: key ? NOW : null,
  };
});
await blob.write(`motorsports/${motorsportId}/races.json`, races);
const raceByTitle = Object.fromEntries(races.map(r => [r.title, r]));
console.log(`  ✓ ${races.length} races (${Object.keys(titleToKey).length} graded)`);

// 5. League
console.log("Seeding league...");
await blob.write("leagues.json", [{
  id: leagueId,
  commissionerId: "SrmOfH7ttqY42T5k3g11rlKgLvh5PZ5J",
  name: "Shrek's F1 2026",
  placementPoints: PLACEMENT_POINTS,
  mulliganCount: MULLIGAN_COUNT,
  scoringDepth: 17,
  stageCount: 4,
  propPointValues: PROP_POINT_VALUES,
  teamPositionPoints: TEAM_POSITION_POINTS,
  motorsportId,
}]);
console.log(`  ✓ Shrek's F1 2026 (${leagueId})`);

// 6. Teams
console.log("Seeding teams...");
await blob.write(`leagues/${leagueId}/teams.json`,
  leagueTeams.map(t => ({ id: t.id, name: t.name, memberIds: t.memberIds, color: t.color }))
);
for (const team of leagueTeams) {
  console.log(`  ✓ ${team.name} [${team.memberIds.length} members]`);
}

// 7. Predictions + scores
console.log("Seeding predictions and scores...");
const standingsIndividual = new Map<string, { raceId: string; gridPoints: number; propPoints: number; weeklyTeamPoints: number }[]>();
const standingsTeams = new Map<string, { raceId: string; gridPoints: number; propPoints: number; weeklyTeamPoints: number }[]>();
const gradedRaceIds: string[] = [];

for (const key of GRADED_RACE_KEYS) {
  const titleMap: Record<RaceKey, string> = {
    australian: "Australian Grand Prix",
    chinese:    "Chinese Grand Prix",
    japanese:   "Japanese Grand Prix",
    miami:      "Miami Grand Prix",
  };
  const race = raceByTitle[titleMap[key]];
  const preds = PREDICTIONS[key];
  const keyOrder = ACTUAL[key];
  const propKey = PROP_KEYS[key];

  // Write predictions blob
  const predictionsData: Record<string, string[]> = {};
  const propPicksData: Record<string, PropPicks> = {};
  const submittedAtData: Record<string, string> = {};
  for (const user of users) {
    predictionsData[user.id] = preds[user.id].order;
    propPicksData[user.id] = preds[user.id].props;
    submittedAtData[user.id] = NOW;
  }
  await blob.write(`leagues/${leagueId}/races/${race.id}/predictions.json`, {
    predictions: predictionsData,
    propPicks: propPicksData,
    submittedAt: submittedAtData,
  });

  // Compute scores
  const rawEntries = users.map(user => ({
    userId: user.id,
    gridPoints: computeGridPoints(preds[user.id].order, keyOrder, PLACEMENT_POINTS, 17),
    propPoints: computePropPoints(preds[user.id].props, propKey, PROP_POINT_VALUES),
  }));
  const gradedEntries = assignMedals(rawEntries);

  // Compute weekly team points — tied users split the points pool for their positions
  const weeklyMap = computeWeeklyTeamPoints(
    gradedEntries.map(e => ({ userId: e.userId, total: e.gridPoints + e.propPoints })),
    TEAM_POSITION_POINTS,
  );
  const entriesWithTeamPoints = gradedEntries.map(e => ({
    ...e,
    weeklyTeamPoints: weeklyMap.get(e.userId) ?? 0,
  }));

  await blob.write(`leagues/${leagueId}/races/${race.id}/scores.json`, {
    raceId: race.id,
    leagueId,
    raceTitle: race.title,
    raceDate: race.date,
    entries: entriesWithTeamPoints,
  });

  // Accumulate standings
  gradedRaceIds.push(race.id);
  for (const entry of entriesWithTeamPoints) {
    const existing = standingsIndividual.get(entry.userId) ?? [];
    standingsIndividual.set(entry.userId, [...existing, {
      raceId: race.id,
      gridPoints: entry.gridPoints,
      propPoints: entry.propPoints,
      weeklyTeamPoints: entry.weeklyTeamPoints,
    }]);

    const teamId = teamMembership.get(entry.userId);
    if (teamId && activeTeamIds.has(teamId)) {
      const existingTeam = standingsTeams.get(teamId) ?? [];
      standingsTeams.set(teamId, [...existingTeam, {
        raceId: race.id,
        gridPoints: entry.gridPoints,
        propPoints: entry.propPoints,
        weeklyTeamPoints: entry.weeklyTeamPoints,
      }]);
    }
  }

  console.log(`  ✓ ${race.title}`);
}

// 8. Standings
console.log("Writing standings...");
await blob.write(`leagues/${leagueId}/standings.json`, {
  leagueId,
  gradedRaceIds,
  individual: Array.from(standingsIndividual.entries()).map(([userId, raceScores]) => ({ userId, raceScores })),
  teams: Array.from(standingsTeams.entries()).map(([teamId, raceScores]) => ({ teamId, raceScores })),
});

await prisma.$disconnect();

console.log("\nDone! 🏁");
console.log(`  League:       Shrek's F1 2026 (${leagueId})`);
console.log(`  Motorsport:   Formula 1 (${motorsportId})`);
console.log(`  Participants: ${users.map(u => u.name).join(", ")}`);
console.log(`  Teams:        ${leagueTeams.map(t => t.name).join(", ")}`);
console.log(`  Graded races: ${gradedRaceIds.length} / ${races.length}`);
