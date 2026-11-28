/** Splits CSV text into rows of cells (handles quotes and commas inside quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

/**
 * Reads the yearly-picks sheet: player names run across one row, each question
 * has its own row (question title in the first column, one answer per player).
 * Reading stops at the first row whose title starts with "Points".
 */
export function parsePicksSheet(text: string): { player: string; picks: Record<string, string> }[] {
  const grid = parseCsv(text);
  const firstQuestion = grid.findIndex((r, i) => i > 0 && r[0]?.trim() && grid[i - 1][0]?.trim() === "" && (grid[i - 1].filter((c) => c.trim()).length >= 2));
  if (firstQuestion < 1) return [];
  const header = grid[firstQuestion - 1];
  const questions: { title: string; cells: string[] }[] = [];
  for (let i = firstQuestion; i < grid.length; i++) {
    const title = grid[i][0]?.trim() ?? "";
    if (!title || /^points/i.test(title)) break;
    questions.push({ title, cells: grid[i] });
  }
  const players: { player: string; picks: Record<string, string> }[] = [];
  for (let col = 1; col < header.length; col++) {
    const name = header[col]?.trim();
    if (!name) continue;
    const picks: Record<string, string> = {};
    for (const q of questions) picks[q.title] = (q.cells[col] ?? "").trim();
    if (Object.values(picks).some(Boolean)) players.push({ player: name, picks });
  }
  return players;
}
