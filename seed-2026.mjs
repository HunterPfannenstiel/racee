const BASE_URL = "http://localhost:3000";

const season = { id: crypto.randomUUID(), name: "F1 2026" };

const racers = [
  { id: crypto.randomUUID(), name: "Max Verstappen", team: "Red Bull Racing" },
  { id: crypto.randomUUID(), name: "Isack Hadjar", team: "Red Bull Racing" },
  { id: crypto.randomUUID(), name: "George Russell", team: "Mercedes" },
  { id: crypto.randomUUID(), name: "Kimi Antonelli", team: "Mercedes" },
  { id: crypto.randomUUID(), name: "Charles Leclerc", team: "Ferrari" },
  { id: crypto.randomUUID(), name: "Lewis Hamilton", team: "Ferrari" },
  { id: crypto.randomUUID(), name: "Lando Norris", team: "McLaren" },
  { id: crypto.randomUUID(), name: "Oscar Piastri", team: "McLaren" },
  { id: crypto.randomUUID(), name: "Fernando Alonso", team: "Aston Martin" },
  { id: crypto.randomUUID(), name: "Lance Stroll", team: "Aston Martin" },
  { id: crypto.randomUUID(), name: "Alex Albon", team: "Williams" },
  { id: crypto.randomUUID(), name: "Carlos Sainz Jr.", team: "Williams" },
  { id: crypto.randomUUID(), name: "Pierre Gasly", team: "Alpine" },
  { id: crypto.randomUUID(), name: "Franco Colapinto", team: "Alpine" },
  { id: crypto.randomUUID(), name: "Gabriel Bortoleto", team: "Audi" },
  { id: crypto.randomUUID(), name: "Nico Hulkenberg", team: "Audi" },
  { id: crypto.randomUUID(), name: "Esteban Ocon", team: "Haas" },
  { id: crypto.randomUUID(), name: "Oliver Bearman", team: "Haas" },
  { id: crypto.randomUUID(), name: "Liam Lawson", team: "Racing Bulls" },
  { id: crypto.randomUUID(), name: "Arvid Lindblad", team: "Racing Bulls" },
  { id: crypto.randomUUID(), name: "Sergio Perez", team: "Cadillac" },
  { id: crypto.randomUUID(), name: "Valtteri Bottas", team: "Cadillac" },
];

const allRacerIds = racers.map((r) => r.id);

const races = [
  { title: "Australian Grand Prix", date: "2026-03-08" },
  { title: "Chinese Grand Prix", date: "2026-03-15" },
  { title: "Japanese Grand Prix", date: "2026-03-29" },
  { title: "Miami Grand Prix", date: "2026-05-03" },
  { title: "Canadian Grand Prix", date: "2026-05-24" },
  { title: "Monaco Grand Prix", date: "2026-06-07" },
  { title: "Barcelona-Catalunya Grand Prix", date: "2026-06-14" },
  { title: "Austrian Grand Prix", date: "2026-06-28" },
  { title: "British Grand Prix", date: "2026-07-05" },
  { title: "Belgian Grand Prix", date: "2026-07-19" },
  { title: "Hungarian Grand Prix", date: "2026-07-26" },
  { title: "Dutch Grand Prix", date: "2026-08-23" },
  { title: "Italian Grand Prix", date: "2026-09-06" },
  { title: "Spanish Grand Prix", date: "2026-09-13" },
  { title: "Azerbaijan Grand Prix", date: "2026-09-26" },
  { title: "Singapore Grand Prix", date: "2026-10-11" },
  { title: "United States Grand Prix", date: "2026-10-25" },
  { title: "Mexican Grand Prix", date: "2026-11-01" },
  { title: "Brazilian Grand Prix", date: "2026-11-08" },
  { title: "Las Vegas Grand Prix", date: "2026-11-22" },
  { title: "Qatar Grand Prix", date: "2026-11-29" },
  { title: "Abu Dhabi Grand Prix", date: "2026-12-06" },
].map((r) => ({ id: crypto.randomUUID(), seasonId: season.id, racerIds: allRacerIds, ...r }));

async function put(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
}

console.log("Seeding season...");
await put("/api/seasons", [season]);

console.log("Seeding racers...");
await put("/api/racers", racers);

console.log("Seeding races...");
for (const race of races) {
  await put("/api/races", race);
  console.log(`  ✓ ${race.title}`);
}

console.log("Done.");
