const BASE_URL = "http://localhost:3000";

const season = { id: crypto.randomUUID(), name: "F1 2025" };

const racers = [
  { id: crypto.randomUUID(), name: "Max Verstappen", team: "Red Bull Racing" },
  { id: crypto.randomUUID(), name: "Liam Lawson", team: "Red Bull Racing" },
  { id: crypto.randomUUID(), name: "Charles Leclerc", team: "Ferrari" },
  { id: crypto.randomUUID(), name: "Lewis Hamilton", team: "Ferrari" },
  { id: crypto.randomUUID(), name: "Lando Norris", team: "McLaren" },
  { id: crypto.randomUUID(), name: "Oscar Piastri", team: "McLaren" },
  { id: crypto.randomUUID(), name: "George Russell", team: "Mercedes" },
  { id: crypto.randomUUID(), name: "Kimi Antonelli", team: "Mercedes" },
  { id: crypto.randomUUID(), name: "Fernando Alonso", team: "Aston Martin" },
  { id: crypto.randomUUID(), name: "Lance Stroll", team: "Aston Martin" },
  { id: crypto.randomUUID(), name: "Yuki Tsunoda", team: "Racing Bulls" },
  { id: crypto.randomUUID(), name: "Isack Hadjar", team: "Racing Bulls" },
  { id: crypto.randomUUID(), name: "Oliver Bearman", team: "Haas" },
  { id: crypto.randomUUID(), name: "Esteban Ocon", team: "Haas" },
  { id: crypto.randomUUID(), name: "Pierre Gasly", team: "Alpine" },
  { id: crypto.randomUUID(), name: "Jack Doohan", team: "Alpine" },
  { id: crypto.randomUUID(), name: "Alex Albon", team: "Williams" },
  { id: crypto.randomUUID(), name: "Carlos Sainz Jr.", team: "Williams" },
  { id: crypto.randomUUID(), name: "Nico Hulkenberg", team: "Kick Sauber" },
  { id: crypto.randomUUID(), name: "Gabriel Bortoleto", team: "Kick Sauber" },
];

const allRacerIds = racers.map((r) => r.id);

const races = [
  { title: "Australian Grand Prix", date: "2025-03-16" },
  { title: "Chinese Grand Prix", date: "2025-03-23" },
  { title: "Japanese Grand Prix", date: "2025-04-06" },
  { title: "Bahrain Grand Prix", date: "2025-04-13" },
  { title: "Saudi Arabian Grand Prix", date: "2025-04-20" },
  { title: "Miami Grand Prix", date: "2025-05-04" },
  { title: "Emilia-Romagna Grand Prix", date: "2025-05-18" },
  { title: "Monaco Grand Prix", date: "2025-05-25" },
  { title: "Spanish Grand Prix", date: "2025-06-01" },
  { title: "Canadian Grand Prix", date: "2025-06-15" },
  { title: "Austrian Grand Prix", date: "2025-06-29" },
  { title: "British Grand Prix", date: "2025-07-06" },
  { title: "Belgian Grand Prix", date: "2025-07-27" },
  { title: "Hungarian Grand Prix", date: "2025-08-03" },
  { title: "Dutch Grand Prix", date: "2025-08-31" },
  { title: "Italian Grand Prix", date: "2025-09-07" },
  { title: "Azerbaijan Grand Prix", date: "2025-09-21" },
  { title: "Singapore Grand Prix", date: "2025-10-05" },
  { title: "United States Grand Prix", date: "2025-10-19" },
  { title: "Mexico City Grand Prix", date: "2025-10-26" },
  { title: "São Paulo Grand Prix", date: "2025-11-09" },
  { title: "Las Vegas Grand Prix", date: "2025-11-22" },
  { title: "Qatar Grand Prix", date: "2025-11-30" },
  { title: "Abu Dhabi Grand Prix", date: "2025-12-07" },
].map((r) => ({ id: crypto.randomUUID(), seasonId: season.id, racerIds: allRacerIds, ...r }));

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
}

console.log("Seeding season...");
await post("/api/seasons", [season]);

console.log("Seeding racers...");
await post("/api/racers", racers);

console.log("Seeding races...");
for (const race of races) {
  await post("/api/races", race);
  console.log(`  ✓ ${race.title}`);
}

console.log("Done.");
