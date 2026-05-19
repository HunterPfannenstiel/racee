// Run with: node --env-file=.env.local seed-2026.mjs
// WARNING: wipes all blob storage before seeding, including participants

const BASE_URL = "http://localhost:3000";

// ---- League ----
const league = {
  id: crypto.randomUUID(),
  name: "Shrek's F1 2026",
  placementPoints: [10, 7, 3],
  mulliganCount: 2,
  propPointValues: {
    driverOfDay: 5,
    lapsLed: 5,
    fastestPitStop: 5,
    fastestLap: 5,
    overAchiever: 5,
    underAchiever: 5,
    wrecker: 5,
  },
};

// ---- Team Colors (2026 Official) ----
// Source: https://www.infysia.com/design/f1-team-color-codes/ (practical digital reference values)
// Haas officially runs white (#FFFFFF) but we use silver for visibility
const TEAM_COLORS = {
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
].map((r) => ({ id: crypto.randomUUID(), ...r, teamColor: TEAM_COLORS[r.team] }));

// Lookup racer ID by name
const R = Object.fromEntries(racers.map((r) => [r.name, r.id]));

const allRacerIds = racers.map((r) => r.id);

// ---- Participants ----
const users = [
  { id: crypto.randomUUID(), name: "Shrek" },
  { id: crypto.randomUUID(), name: "Donkey" },
  { id: crypto.randomUUID(), name: "Puss in Boots" },
  { id: crypto.randomUUID(), name: "Fiona" },
  { id: crypto.randomUUID(), name: "Lord Farquaad" },
  { id: crypto.randomUUID(), name: "Gingy" },
];
const [shrek, donkey, puss, fiona, farquaad, gingy] = users;

// ---- League Teams ----
const leagueTeams = [
  {
    id: crypto.randomUUID(),
    name: "Swamp Dwellers",
    color: "#6B8E23",
    memberIds: [shrek.id, donkey.id, puss.id],
  },
  {
    id: crypto.randomUUID(),
    name: "Far Far Away",
    color: "#9B59B6",
    memberIds: [fiona.id, farquaad.id, gingy.id],
  },
];

// ---- Races ----
const races = [
  { title: "Australian Grand Prix",         date: "2026-03-08" },
  { title: "Chinese Grand Prix",            date: "2026-03-15" },
  { title: "Japanese Grand Prix",           date: "2026-03-29" },
  { title: "Miami Grand Prix",              date: "2026-05-03" },
  { title: "Canadian Grand Prix",           date: "2026-05-24" },
  { title: "Monaco Grand Prix",             date: "2026-06-07" },
  { title: "Barcelona-Catalunya Grand Prix",date: "2026-06-14" },
  { title: "Austrian Grand Prix",           date: "2026-06-28" },
  { title: "British Grand Prix",            date: "2026-07-05" },
  { title: "Belgian Grand Prix",            date: "2026-07-19" },
  { title: "Hungarian Grand Prix",          date: "2026-07-26" },
  { title: "Dutch Grand Prix",              date: "2026-08-23" },
  { title: "Italian Grand Prix",            date: "2026-09-06" },
  { title: "Spanish Grand Prix",            date: "2026-09-13" },
  { title: "Azerbaijan Grand Prix",         date: "2026-09-26" },
  { title: "Singapore Grand Prix",          date: "2026-10-11" },
  { title: "United States Grand Prix",      date: "2026-10-25" },
  { title: "Mexican Grand Prix",            date: "2026-11-01" },
  { title: "Brazilian Grand Prix",          date: "2026-11-08" },
  { title: "Las Vegas Grand Prix",          date: "2026-11-22" },
  { title: "Qatar Grand Prix",              date: "2026-11-29" },
  { title: "Abu Dhabi Grand Prix",          date: "2026-12-06" },
].map((r) => ({ id: crypto.randomUUID(), leagueId: league.id, racerIds: allRacerIds, ...r }));

const raceByTitle = Object.fromEntries(races.map((r) => [r.title, r]));

// ---- Actual Finishing Orders (race keys) ----
// Source: https://www.formula1.com/en/results/2026/races (official F1 results)
// DNFs are placed at the end of the order.
const ACTUAL = {
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

// ---- Prop Keys (official answers) ----
const PROP_KEYS = {
  australian: {
    lapsLed:       [R["George Russell"]],   // led from pole, dominated
    fastestLap:    [R["Lando Norris"]],     // fastest lap charge through the field
    driverOfDay:   [R["Oliver Bearman"]],   // P7 in the Haas, fan favourite result
    fastestPitStop:["Mercedes"],            // Mercedes slick stop
    overAchiever:  [R["Oliver Bearman"]],   // Haas P7 massively outperformed
    underAchiever: [R["Fernando Alonso"]],  // Expected points, DNF
    wrecker:       [R["Isack Hadjar"]],     // Incident causing his own DNF
  },
  chinese: {
    lapsLed:       [R["Kimi Antonelli"]],   // Led the whole way
    fastestLap:    [R["George Russell"]],   // Russell fastest lap chasing Antonelli
    driverOfDay:   [R["Oliver Bearman"]],   // P5 in Haas — crowd goes wild
    fastestPitStop:["Ferrari"],             // Ferrari nailed the stop
    overAchiever:  [R["Oliver Bearman"]],   // Haas punching way above weight
    underAchiever: [R["Lando Norris"]],     // Norris favourite, DNF
    wrecker:       [R["Max Verstappen"]],   // Red Bull issue, DNF
  },
  japanese: {
    lapsLed:       [R["Kimi Antonelli"]],   // Dominated Suzuka
    fastestLap:    [R["Lando Norris"]],     // Norris sets fastest lap
    driverOfDay:   [R["Oscar Piastri"]],    // Brilliant P2 from Piastri
    fastestPitStop:["McLaren"],             // McLaren fastest pit
    overAchiever:  [R["Pierre Gasly"]],     // Alpine P7 — strong result
    underAchiever: [R["Max Verstappen"]],   // Red Bull only P8, expected more
    wrecker:       [R["Lance Stroll"]],     // Stroll incident, DNF
  },
  miami: {
    lapsLed:       [R["Kimi Antonelli"]],   // Led from lights to flag again
    fastestLap:    [R["Max Verstappen"]],   // Verstappen fastest lap after penalty
    driverOfDay:   [R["Franco Colapinto"]], // P7 Alpine — sensational drive
    fastestPitStop:["McLaren"],             // McLaren rapid stop
    overAchiever:  [R["Franco Colapinto"]], // Colapinto delivers in Miami
    underAchiever: [R["Charles Leclerc"]],  // Leclerc expected podium, got P8 + penalty
    wrecker:       [R["Pierre Gasly"]],     // Gasly DNF, incident with Lawson
  },
};

// ---- User Predictions ----
// Each user has a distinct prediction style. Points are earned when
// a racer is within `placementPoints.length` positions of their actual finish.
// placementPoints: [10, 7, 3] → exact=10pts, 1-off=7pts, 2-off=3pts
//
// Fiona        (~leader)    gets top-3 mostly right, solid props
// Shrek        (~2nd)       good grid calls, mixed props
// Lord Farquaad(~3rd)       one great race (Miami), otherwise solid
// Donkey       (~4th)       consistent mediocre — always close, never quite right
// Puss in Boots(~5th)       improving, decent props sometimes
// Gingy        (~last)      out of their depth, lots of upsets predicted

const PREDICTIONS = {
  australian: {
    // Actual: Russell, Antonelli, Leclerc, Hamilton, Norris, Verstappen, Bearman...
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
    // Actual: Antonelli, Russell, Hamilton, Leclerc, Bearman, Gasly, Lawson, Hadjar...
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
    // Actual: Antonelli, Piastri, Leclerc, Russell, Norris, Hamilton, Gasly, Verstappen...
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
    // Actual: Antonelli, Norris, Piastri, Russell, Verstappen, Hamilton, Colapinto, Leclerc...
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
      order: [R["Lando Norris"], R["Kimi Antonelli"], R["Oscar Piastri"], R["George Russell"],
              R["Lewis Hamilton"], R["Max Verstappen"], R["Charles Leclerc"], R["Franco Colapinto"],
              R["Carlos Sainz Jr."], R["Alex Albon"], R["Oliver Bearman"], R["Esteban Ocon"],
              R["Gabriel Bortoleto"], R["Arvid Lindblad"], R["Fernando Alonso"], R["Sergio Perez"],
              R["Lance Stroll"], R["Nico Hulkenberg"], R["Valtteri Bottas"], R["Liam Lawson"],
              R["Pierre Gasly"], R["Isack Hadjar"]],
      props: { lapsLed: R["Lando Norris"], fastestLap: R["Lando Norris"], driverOfDay: R["Alex Albon"],
               fastestPitStop: "McLaren", overAchiever: R["Carlos Sainz Jr."],
               underAchiever: R["Charles Leclerc"], wrecker: R["Isack Hadjar"] },
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

// ---- Helpers ----
async function wipeStorage() {
  console.log("Wiping existing storage...");
  if (process.env.USE_LOCAL_BLOB === "true") {
    const { rm } = await import("fs/promises");
    const { join } = await import("path");
    await rm(join(process.cwd(), ".blob-store"), { recursive: true, force: true });
  } else {
    const { list, del } = await import("@vercel/blob");
    let cursor;
    do {
      const { blobs, cursor: next } = await list({ cursor, limit: 1000 });
      if (blobs.length > 0) await del(blobs.map((b) => b.url));
      cursor = next;
    } while (cursor);
  }
  console.log("  Done");
}

async function put(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status} ${await res.text()}`);
}

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status} ${await res.text()}`);
}

// ---- Seed ----
await wipeStorage();

console.log("Seeding league...");
await put("/api/leagues", [league]);

console.log("Seeding racers...");
await put("/api/racers", racers);

console.log("Seeding participants...");
await put("/api/participants", { users });

console.log("Seeding races...");
for (const race of races) {
  await put("/api/races", race);
  console.log(`  ✓ ${race.title}`);
}

console.log("Seeding league teams...");
for (const team of leagueTeams) {
  await put(`/api/leagues/${league.id}/teams/${team.id}`, team);
  console.log(`  ✓ ${team.name}`);
}

const GRADED_RACES = [
  { key: "australian", title: "Australian Grand Prix" },
  { key: "chinese",    title: "Chinese Grand Prix" },
  { key: "japanese",   title: "Japanese Grand Prix" },
  { key: "miami",      title: "Miami Grand Prix" },
];

console.log("Seeding predictions...");
for (const { key, title } of GRADED_RACES) {
  const race = raceByTitle[title];
  const preds = PREDICTIONS[key];
  for (const user of users) {
    const { order, props } = preds[user.id];
    await post("/api/predict/prediction", {
      leagueId: league.id,
      raceId: race.id,
      userId: user.id,
      racerIds: order,
      propPicks: props,
    });
  }
  console.log(`  ✓ ${title} (${users.length} predictions)`);
}

console.log("Seeding race keys (grading)...");
for (const { key, title } of GRADED_RACES) {
  const race = raceByTitle[title];
  await put("/api/races/key", {
    leagueId: league.id,
    raceId: race.id,
    racerIds: ACTUAL[key],
    propKey: PROP_KEYS[key],
  });
  console.log(`  ✓ ${title}`);
}

console.log("\nDone! 🏁");
console.log(`  League:       ${league.name} (${league.id})`);
console.log(`  Participants: ${users.map(u => u.name).join(", ")}`);
console.log(`  Teams:        ${leagueTeams.map(t => t.name).join(", ")}`);
console.log(`  Graded races: ${GRADED_RACES.length} / ${races.length}`);
