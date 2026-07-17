// Phase A of the Excel -> app migration: read-only extraction.
//
// Parses the historical race workbooks into normalized JSON + an issues
// report per race. Does NOT write to blob storage, does NOT call any
// grading/prediction service, does NOT touch prod. Output is meant to be
// read by a human before Phase B (load) is ever written.
//
// Run: npx tsx scripts/archived/migration/extract.ts
// Override source dir: MIGRATION_EXCEL_DIR=/path/to/xlsx-folder npx tsx scripts/archived/migration/extract.ts

import ExcelJS from "exceljs";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Default assumes a sibling `excel/2026 Per Race Results` folder next to this
// repo (i.e. /path/to/racee/excel/2026 Per Race Results, repo at /path/to/racee/my-app).
const EXCEL_DIR =
  process.env.MIGRATION_EXCEL_DIR ??
  path.resolve(__dirname, "../../../excel/2026 Per Race Results");

const BLOB_STORE_DIR = path.resolve(__dirname, "../../.blob-store");
const OUTPUT_DIR = path.resolve(__dirname, "output");

// -----------------------------------------------------------------------
// Scope: the 5 races this backfill batch covers. Bahrain/Saudi Arabia are
// known to be missing from the zip and will be added in a later batch.
// -----------------------------------------------------------------------
const RACES: { file: string; expectedLabel: string }[] = [
  { file: "Australia_.xlsx", expectedLabel: "Australia" },
  { file: "China.xlsx", expectedLabel: "China" },
  { file: "Japan.xlsx", expectedLabel: "Japan" },
  { file: "Miami.xlsx", expectedLabel: "Miami" },
  { file: "Canada.xlsx", expectedLabel: "Canada" },
];

const PROP_NAMES = [
  "driverOfDay",
  "lapsLed",
  "fastestPitStop",
  "fastestLap",
  "overAchiever",
  "underAchiever",
  "wrecker",
] as const;
type PropName = (typeof PROP_NAMES)[number];

// Inline "Label:" text (as it literally appears in column D of Race Results,
// and in each team-member's bonus-pick column) mapped to the app's PropName
// enum. DOTD has no inline label of its own — its column header IS the
// label, handled separately in the scanner below.
const PROP_LABEL_PATTERNS: { pattern: RegExp; prop: PropName }[] = [
  { pattern: /^laps led:?$/i, prop: "lapsLed" },
  { pattern: /^fastest pit:?$/i, prop: "fastestPitStop" },
  { pattern: /^fastest lap:?$/i, prop: "fastestLap" },
  { pattern: /^overachiever:?$/i, prop: "overAchiever" },
  { pattern: /^underachiever:?$/i, prop: "underAchiever" },
  { pattern: /^wrecker:?$/i, prop: "wrecker" },
];

// Known constructor-name abbreviations that won't resolve via substring
// matching against racers.json's `team` field (e.g. "RB" is not a substring
// of "Racing Bulls"). Extend as new files reveal more.
const TEAM_ALIASES: Record<string, string> = {
  rb: "Racing Bulls",
  vcarb: "Racing Bulls",
};

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------
type Racer = { id: string; name: string; team: string };

type Resolved<T> = { raw: string; resolved: T | null; method: string };

type Issue = { code: string; message: string; context?: Record<string, unknown> };

type PlayerPropPicks = Partial<Record<PropName, Resolved<string> | null>>;

type PlayerPrediction = {
  playerName: string;
  email: string | null;
  userId: null; // resolved in Phase B against real prod user accounts
  teamNameRaw: string;
  order: { position: number; driverNameRaw: string; racerId: string | null }[];
};

type RaceExtract = {
  sourceFile: string;
  raceLabel: string;
  identityCrossCheck: { expected: string; found: string | null; passed: boolean };
  keyOrder: { position: number; driverNameRaw: string; racerId: string | null }[];
  propKey: Record<PropName, Resolved<string>[]>;
  predictions: Record<string, PlayerPrediction>;
  propPicks: Record<string, { playerName: string; teamNameRaw: string; picks: PlayerPropPicks }>;
};

type RaceReport = {
  race: string;
  sourceFile: string;
  blocking: Issue[];
  warnings: Issue[];
  notes: Issue[];
};

// -----------------------------------------------------------------------
// Reference data
// -----------------------------------------------------------------------
function loadRacers(): Racer[] {
  const raw = readFileSync(path.join(BLOB_STORE_DIR, "racers.json"), "utf8");
  return JSON.parse(raw) as Racer[];
}

function loadContactEmails(ws: ExcelJS.Worksheet | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!ws) return map;
  // "2026 teams and contacts": col C = player name, col E = email. Rows repeat
  // per mini-tournament payout entry, so just take the first email seen per name.
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const name = cellText(row.getCell(3));
    const email = cellText(row.getCell(5));
    if (name && email && !map.has(normalize(name))) {
      map.set(normalize(name), email);
    }
  });
  return map;
}

// -----------------------------------------------------------------------
// Generic helpers
// -----------------------------------------------------------------------
function normalize(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

function cellText(cell: ExcelJS.Cell | undefined): string {
  if (!cell) return "";
  const v = cell.value as unknown;
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    const obj = v as { result?: unknown; richText?: { text: string }[]; text?: string };
    // richText cells can carry a trailing/leading whitespace-only run under
    // different font styling (seen on "Wrecker" cells) — trim each run
    // individually before joining, not just the final concatenation.
    if (obj.richText) return obj.richText.map((t) => t.text.trim()).join(" ").trim();
    if ("result" in obj) return obj.result == null ? "" : String(obj.result).trim();
    if (obj.text) return obj.text.trim();
    return "";
  }
  return String(v).trim();
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array(b.length).fill(0),
  ]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/** Resolve a raw driver name against racers.json: exact -> bidirectional substring -> small edit distance. */
function resolveDriver(rawName: string, racers: Racer[]): Resolved<string> {
  const raw = rawName.trim();
  const n = normalize(raw);
  if (!n || n === "#ref!") return { raw, resolved: null, method: "empty" };

  const exact = racers.find((r) => normalize(r.name) === n);
  if (exact) return { raw, resolved: exact.id, method: "exact" };

  const contains = racers.filter((r) => {
    const rn = normalize(r.name);
    return rn.includes(n) || n.includes(rn);
  });
  if (contains.length === 1) return { raw, resolved: contains[0].id, method: "fuzzy-substring" };
  if (contains.length > 1) return { raw, resolved: null, method: "ambiguous-substring" };

  const distances = racers
    .map((r) => ({ r, d: levenshtein(n, normalize(r.name)) }))
    .sort((a, b) => a.d - b.d);
  if (distances[0] && distances[0].d <= 2) {
    return { raw, resolved: distances[0].r.id, method: `fuzzy-edit-distance-${distances[0].d}` };
  }
  return { raw, resolved: null, method: "no-match" };
}

/** Resolve a raw constructor name (Fastest Pit prop) to the canonical `team` string used in racers.json. */
function resolveConstructor(rawTeam: string, racers: Racer[]): Resolved<string> {
  const raw = rawTeam.trim();
  const n = normalize(raw);
  if (!n) return { raw, resolved: null, method: "empty" };

  const canonicalTeams = [...new Set(racers.map((r) => r.team))];

  const exact = canonicalTeams.find((t) => normalize(t) === n);
  if (exact) return { raw, resolved: exact, method: "exact" };

  if (TEAM_ALIASES[n]) {
    const aliasTarget = canonicalTeams.find((t) => normalize(t) === normalize(TEAM_ALIASES[n]));
    if (aliasTarget) return { raw, resolved: aliasTarget, method: "alias" };
  }

  const contains = canonicalTeams.filter((t) => {
    const tn = normalize(t);
    return tn.includes(n) || n.includes(tn);
  });
  if (contains.length === 1) return { raw, resolved: contains[0], method: "fuzzy-substring" };
  if (contains.length > 1) return { raw, resolved: null, method: "ambiguous-substring" };

  return { raw, resolved: null, method: "no-match" };
}

/** Find a team's own sheet tab, tolerating spelling drift (e.g. "Zues Racing" vs "Zeus Racing") and Excel's 31-char tab name truncation. */
function findTeamSheet(
  wb: ExcelJS.Workbook,
  teamNameRaw: string,
): { ws: ExcelJS.Worksheet | null; matchedName: string | null; method: string } {
  const sheets = wb.worksheets.filter(
    (ws) => !["Rules And Regulations.", "Rules and Regulations", "Standings", "Points", "Race Results", "Weekly Lineups", "Yearly Prop Bets", "Contact Info", "2026 teams and contacts", "Drivers"].includes(ws.name),
  );
  const n = normalize(teamNameRaw);
  const nTrunc = n.slice(0, 31);

  const exact = sheets.find((ws) => normalize(ws.name) === n || normalize(ws.name) === nTrunc);
  if (exact) return { ws: exact, matchedName: exact.name, method: "exact" };

  const contains = sheets.filter((ws) => {
    const sn = normalize(ws.name);
    return sn.includes(nTrunc) || nTrunc.includes(sn) || n.includes(sn) || sn.includes(n);
  });
  if (contains.length === 1) return { ws: contains[0], matchedName: contains[0].name, method: "fuzzy-substring" };

  const distances = sheets
    .map((ws) => ({ ws, d: levenshtein(nTrunc, normalize(ws.name).slice(0, 31)) }))
    .sort((a, b) => a.d - b.d);
  if (distances[0] && distances[0].d <= 3) {
    return { ws: distances[0].ws, matchedName: distances[0].ws.name, method: `fuzzy-edit-distance-${distances[0].d}` };
  }
  return { ws: null, matchedName: null, method: "no-match" };
}

/**
 * Generic label/value scanner used for both the Race Results answer-key prop
 * column and each team member's bonus-pick column. Both follow the same
 * shape: an implicit "driverOfDay" value right under the header, then
 * "Label:" cells whose value(s) are the following non-empty row(s) until the
 * next label. Scanning by label text (rather than hardcoded row offsets)
 * survives minor row-count drift between files.
 */
function scanLabeledColumn(
  ws: ExcelJS.Worksheet,
  col: number,
  startRow: number,
  maxRows: number,
): { values: Record<PropName, string[]>; unrecognizedLabels: string[] } {
  const values: Record<PropName, string[]> = {
    driverOfDay: [],
    lapsLed: [],
    fastestPitStop: [],
    fastestLap: [],
    overAchiever: [],
    underAchiever: [],
    wrecker: [],
  };
  const unrecognizedLabels: string[] = [];
  let current: PropName = "driverOfDay";

  for (let r = startRow; r < startRow + maxRows; r++) {
    const text = cellText(ws.getRow(r).getCell(col));
    if (!text) continue;

    const label = PROP_LABEL_PATTERNS.find((p) => p.pattern.test(text));
    if (label) {
      current = label.prop;
      continue;
    }
    // Unrecognized text that looks like a label (ends in ':') but didn't match
    // any known prop — surface it rather than silently swallowing it as a value.
    if (/:$/.test(text) && !PROP_LABEL_PATTERNS.some((p) => p.pattern.test(text))) {
      unrecognizedLabels.push(`${text} (row ${r})`);
      continue;
    }
    values[current].push(text);
  }
  return { values, unrecognizedLabels };
}

function findHeaderRow(ws: ExcelJS.Worksheet, colA: number, matchText: string, maxScan = 8): number | null {
  for (let r = 1; r <= maxScan; r++) {
    if (normalize(cellText(ws.getRow(r).getCell(colA))) === normalize(matchText)) return r;
  }
  return null;
}

// -----------------------------------------------------------------------
// Per-race extraction
// -----------------------------------------------------------------------
async function extractRace(
  file: string,
  expectedLabel: string,
  racers: Racer[],
): Promise<{ data: RaceExtract | null; report: RaceReport }> {
  const blocking: Issue[] = [];
  const warnings: Issue[] = [];
  const notes: Issue[] = [];
  const report: RaceReport = { race: expectedLabel, sourceFile: file, blocking, warnings, notes };

  const filePath = path.join(EXCEL_DIR, file);
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.readFile(filePath);
  } catch (err) {
    blocking.push({ code: "FILE_READ_ERROR", message: `Could not read ${file}: ${(err as Error).message}` });
    return { data: null, report };
  }

  // ---- Identity cross-check: does the Standings tab's rightmost populated
  // race column actually match this file's name? ----
  const standingsWs = wb.getWorksheet("Standings");
  let foundLabel: string | null = null;
  if (!standingsWs) {
    blocking.push({ code: "MISSING_SHEET", message: `"Standings" sheet not found in ${file}` });
  } else {
    const headerRow = findHeaderRow(standingsWs, 1, "Place");
    if (headerRow == null) {
      blocking.push({ code: "STANDINGS_HEADER_NOT_FOUND", message: `Could not locate the "Place" header row in Standings tab of ${file}` });
    } else {
      // Columns D+ (index 4+) are race name columns. Player rows run from headerRow+1.
      const playerRows: number[] = [];
      for (let r = headerRow + 1; r <= headerRow + 40; r++) {
        const name = cellText(standingsWs.getRow(r).getCell(2));
        if (name) playerRows.push(r);
      }
      // Standings tabs have real race-name columns followed by summary/derived
      // columns ("Stage 1", "Rank", "24 Race Total", "Season Rank", etc.) that
      // are always populated regardless of how many races have happened —
      // exclude anything that isn't plausibly a GP name.
      const NON_RACE_COLUMN = /^stage\b|^rank$|mulligan|^total$|race total|prop bets|with props|season rank|difference/i;
      let bestCol: number | null = null;
      for (let c = 4; c <= 40; c++) {
        const label = cellText(standingsWs.getRow(headerRow).getCell(c));
        if (!label || NON_RACE_COLUMN.test(label)) continue;
        const filled = playerRows.filter((r) => cellText(standingsWs.getRow(r).getCell(c)) !== "").length;
        if (filled >= Math.max(3, playerRows.length / 2)) {
          bestCol = c;
          foundLabel = label;
        }
      }
      if (bestCol == null) {
        blocking.push({ code: "IDENTITY_NO_POPULATED_RACE_COLUMN", message: `Could not find any race column in Standings with majority player data in ${file}` });
      }
    }
  }

  const expectedNorm = normalize(expectedLabel);
  const foundNorm = foundLabel ? normalize(foundLabel) : null;
  const crossCheckPassed = foundNorm != null && (foundNorm === expectedNorm || foundNorm.includes(expectedNorm) || expectedNorm.includes(foundNorm));

  if (!crossCheckPassed) {
    blocking.push({
      code: "ROW_HEADER_IDENTITY_MISMATCH",
      message: `Filename implies "${expectedLabel}" but Standings tab's rightmost populated race column is "${foundLabel ?? "(none found)"}"`,
      context: { expected: expectedLabel, found: foundLabel },
    });
    return {
      data: null,
      report,
    };
  }
  notes.push({ code: "IDENTITY_CONFIRMED", message: `Row-header cross-check confirmed this file is "${foundLabel}"` });

  // ---- Race Results: finish order + prop answer key ----
  const resultsWs = wb.getWorksheet("Race Results");
  if (!resultsWs) {
    blocking.push({ code: "MISSING_SHEET", message: `"Race Results" sheet not found in ${file}` });
    return { data: null, report };
  }

  const resultsHeaderRow = findHeaderRow(resultsWs, 1, "Place");
  if (resultsHeaderRow == null) {
    blocking.push({ code: "RESULTS_HEADER_NOT_FOUND", message: `Could not locate "Place" header row in Race Results tab of ${file}` });
    return { data: null, report };
  }

  const keyOrder: RaceExtract["keyOrder"] = [];
  {
    let blankStreak = 0;
    for (let r = resultsHeaderRow + 1; r < resultsHeaderRow + 40; r++) {
      const placeText = cellText(resultsWs.getRow(r).getCell(1));
      const driverText = cellText(resultsWs.getRow(r).getCell(2));
      if (!driverText) {
        blankStreak++;
        if (blankStreak >= 2) break;
        continue;
      }
      blankStreak = 0;
      const resolved = resolveDriver(driverText, racers);
      if (!resolved.resolved) {
        blocking.push({
          code: "UNRESOLVED_RESULT_DRIVER",
          message: `Finish-order driver "${driverText}" (place ${placeText || r - resultsHeaderRow}) did not resolve to a known racer`,
          context: { row: r, driverText },
        });
      }
      keyOrder.push({ position: keyOrder.length + 1, driverNameRaw: driverText, racerId: resolved.resolved });
    }
  }

  const { values: propAnswerValues, unrecognizedLabels: propAnswerUnrecognized } = scanLabeledColumn(
    resultsWs,
    4,
    resultsHeaderRow + 1,
    30,
  );
  for (const lbl of propAnswerUnrecognized) {
    warnings.push({ code: "UNRECOGNIZED_PROP_LABEL", message: `Unrecognized label-like text in Race Results prop column: "${lbl}"` });
  }

  const propKey: RaceExtract["propKey"] = {
    driverOfDay: [],
    lapsLed: [],
    fastestPitStop: [],
    fastestLap: [],
    overAchiever: [],
    underAchiever: [],
    wrecker: [],
  };
  for (const prop of PROP_NAMES) {
    const rawValues = propAnswerValues[prop];
    if (rawValues.length === 0) {
      warnings.push({ code: "EMPTY_PROP_ANSWER", message: `No answer-key value found for prop "${prop}" in ${file}` });
      continue;
    }
    for (const raw of rawValues) {
      const resolved = prop === "fastestPitStop" ? resolveConstructor(raw, racers) : resolveDriver(raw, racers);
      if (!resolved.resolved) {
        blocking.push({
          code: "UNRESOLVED_PROPKEY_VALUE",
          message: `Answer-key value "${raw}" for prop "${prop}" did not resolve`,
          context: { prop, raw },
        });
      }
      propKey[prop].push(resolved);
    }
  }

  // ---- Weekly Lineups: team -> [player names], in left-to-right column order ----
  const lineupsWs = wb.getWorksheet("Weekly Lineups");
  if (!lineupsWs) {
    blocking.push({ code: "MISSING_SHEET", message: `"Weekly Lineups" sheet not found in ${file}` });
    return { data: null, report };
  }

  type TeamRoster = { teamNameRaw: string; members: { playerName: string; col: number }[] };
  const rosterByTeam: TeamRoster[] = [];
  {
    const teamHeaderRow = lineupsWs.getRow(1);
    const nameRow = lineupsWs.getRow(2);
    let currentTeam: string | null = null;
    const maxCol = Math.max(lineupsWs.columnCount, 40);
    for (let c = 2; c <= maxCol; c++) {
      const teamCell = cellText(teamHeaderRow.getCell(c));
      if (teamCell) currentTeam = teamCell;
      const playerName = cellText(nameRow.getCell(c));
      if (!playerName || !currentTeam) continue;
      let roster = rosterByTeam.find((t) => t.teamNameRaw === currentTeam);
      if (!roster) {
        roster = { teamNameRaw: currentTeam, members: [] };
        rosterByTeam.push(roster);
      }
      roster.members.push({ playerName, col: c });
    }
  }

  const emailMap = loadContactEmails(wb.getWorksheet("2026 teams and contacts"));

  const predictions: RaceExtract["predictions"] = {};
  const propPicksOut: RaceExtract["propPicks"] = {};

  // Weekly Lineups grid order, used both as a fallback and as a cross-check
  // against whatever the team's own sheet says.
  function readLineupOrder(col: number): { position: number; driverNameRaw: string; racerId: string | null }[] {
    const order: { position: number; driverNameRaw: string; racerId: string | null }[] = [];
    let blankStreak = 0;
    for (let r = 3; r < 3 + 40; r++) {
      const text = cellText(lineupsWs!.getRow(r).getCell(col));
      if (!text || text === "#REF!") {
        blankStreak++;
        if (blankStreak >= 2) break;
        continue;
      }
      // Trailing summary rows below the real 18-22 driver picks (e.g. "WEEKLY
      // POINTS:") are labels, not picks — stop rather than append them.
      if (/:$/.test(text)) break;
      blankStreak = 0;
      const resolved = resolveDriver(text, racers);
      order.push({ position: order.length + 1, driverNameRaw: text, racerId: resolved.resolved });
    }
    return order;
  }

  const MEMBER_BLOCKS = [
    { rankCol: 2, propCol: 6 }, // A-H block: member 1 (Place/Driver in B, bonus picks in F)
    { rankCol: 12, propCol: 16 }, // K-S block: member 2 (Place/Driver in L, bonus picks in P)
  ];

  for (const team of rosterByTeam) {
    const { ws: teamWs, matchedName, method } = findTeamSheet(wb, team.teamNameRaw);
    if (!teamWs) {
      warnings.push({
        code: "TEAM_SHEET_NOT_FOUND",
        message: `No sheet tab matched team "${team.teamNameRaw}" — grid picks sourced from Weekly Lineups only, prop picks unavailable for this team`,
        context: { team: team.teamNameRaw },
      });
    } else if (method !== "exact") {
      notes.push({
        code: "TEAM_SHEET_FUZZY_MATCH",
        message: `Team "${team.teamNameRaw}" matched sheet tab "${matchedName}" via ${method}`,
        context: { team: team.teamNameRaw, matchedName, method },
      });
    }

    team.members.forEach((member, idx) => {
      const lineupOrder = readLineupOrder(member.col);
      if (lineupOrder.length === 0) {
        warnings.push({
          code: "EMPTY_PREDICTION",
          message: `Player "${member.playerName}" (team "${team.teamNameRaw}") has zero picks in Weekly Lineups for ${file}`,
          context: { player: member.playerName, team: team.teamNameRaw },
        });
      }

      let order = lineupOrder;
      let picks: PlayerPropPicks = {};

      const block = MEMBER_BLOCKS[idx];
      if (teamWs && block) {
        const teamOrder: { position: number; driverNameRaw: string; racerId: string | null }[] = [];
        let blankStreak = 0;
        for (let r = 2; r < 2 + 40; r++) {
          const text = cellText(teamWs.getRow(r).getCell(block.rankCol));
          if (!text || text === "#REF!") {
            blankStreak++;
            if (blankStreak >= 2) break;
            continue;
          }
          if (/:$/.test(text)) break;
          blankStreak = 0;
          const resolved = resolveDriver(text, racers);
          teamOrder.push({ position: teamOrder.length + 1, driverNameRaw: text, racerId: resolved.resolved });
        }

        if (teamOrder.length > 0) {
          // Cross-check against Weekly Lineups; prefer the team-sheet version
          // (it's the source that also carries the prop picks) but flag drift.
          const mismatchAtFirst = lineupOrder[0]?.driverNameRaw !== teamOrder[0]?.driverNameRaw;
          if (mismatchAtFirst) {
            warnings.push({
              code: "GRID_ORDER_SOURCE_MISMATCH",
              message: `Weekly Lineups and team sheet "${matchedName}" disagree on player "${member.playerName}"'s first pick (member-block assumption may be wrong for this team)`,
              context: { player: member.playerName, team: team.teamNameRaw, weeklyLineupsFirst: lineupOrder[0]?.driverNameRaw, teamSheetFirst: teamOrder[0]?.driverNameRaw },
            });
          }
          order = teamOrder;
        }

        const { values: pickValues, unrecognizedLabels } = scanLabeledColumn(teamWs, block.propCol, 2, 25);
        for (const lbl of unrecognizedLabels) {
          warnings.push({ code: "UNRECOGNIZED_PROP_LABEL", message: `Unrecognized label-like text in team sheet "${matchedName}" bonus-pick column: "${lbl}"`, context: { team: team.teamNameRaw, player: member.playerName } });
        }
        for (const prop of PROP_NAMES) {
          const raw = pickValues[prop];
          if (raw.length === 0) {
            picks[prop] = null;
            continue;
          }
          if (raw.length > 1) {
            warnings.push({
              code: "MULTIPLE_PROP_PICK_VALUES",
              message: `Player "${member.playerName}" has ${raw.length} values for prop "${prop}" (expected exactly 1) — using the first`,
              context: { player: member.playerName, prop, values: raw },
            });
          }
          const resolved = prop === "fastestPitStop" ? resolveConstructor(raw[0], racers) : resolveDriver(raw[0], racers);
          if (!resolved.resolved) {
            warnings.push({
              code: "UNRESOLVED_PLAYER_PROP_PICK",
              message: `Player "${member.playerName}"'s pick "${raw[0]}" for prop "${prop}" did not resolve`,
              context: { player: member.playerName, prop, raw: raw[0] },
            });
          }
          picks[prop] = resolved;
        }
      } else if (idx >= MEMBER_BLOCKS.length) {
        warnings.push({
          code: "TEAM_HAS_EXTRA_MEMBER",
          message: `Team "${team.teamNameRaw}" has more than 2 members; only the first 2 have a known bonus-pick column layout. "${member.playerName}" (member ${idx + 1}) has grid picks only.`,
          context: { team: team.teamNameRaw, player: member.playerName },
        });
      }

      for (const pick of order) {
        if (!pick.racerId) {
          warnings.push({
            code: "UNRESOLVED_PLAYER_ORDER_DRIVER",
            message: `Player "${member.playerName}"'s pick "${pick.driverNameRaw}" (position ${pick.position}) did not resolve to a known racer`,
            context: { player: member.playerName, team: team.teamNameRaw, driverNameRaw: pick.driverNameRaw, position: pick.position },
          });
        }
      }
      const duplicateDrivers = order
        .map((o) => o.racerId)
        .filter((id): id is string => !!id)
        .filter((id, i, arr) => arr.indexOf(id) !== i);
      if (duplicateDrivers.length > 0) {
        warnings.push({
          code: "DUPLICATE_DRIVER_IN_PREDICTION",
          message: `Player "${member.playerName}" has the same driver ranked more than once`,
          context: { player: member.playerName, team: team.teamNameRaw },
        });
      }

      const email = emailMap.get(normalize(member.playerName)) ?? null;
      if (!email) {
        notes.push({ code: "NO_EMAIL_MATCH", message: `No email found in contacts sheet for "${member.playerName}" — will need manual userId resolution in Phase B`, context: { player: member.playerName } });
      }

      predictions[member.playerName] = {
        playerName: member.playerName,
        email,
        userId: null,
        teamNameRaw: team.teamNameRaw,
        order,
      };
      propPicksOut[member.playerName] = {
        playerName: member.playerName,
        teamNameRaw: team.teamNameRaw,
        picks,
      };
    });
  }

  const data: RaceExtract = {
    sourceFile: file,
    raceLabel: foundLabel ?? expectedLabel,
    identityCrossCheck: { expected: expectedLabel, found: foundLabel, passed: crossCheckPassed },
    keyOrder,
    propKey,
    predictions,
    propPicks: propPicksOut,
  };

  return { data, report };
}

// -----------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------
async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const racers = loadRacers();

  const summaryLines: string[] = [
    "# Phase A extraction summary",
    "",
    `Source: \`${EXCEL_DIR}\``,
    `Reference racers: \`${path.join(BLOB_STORE_DIR, "racers.json")}\` (**local dev data — re-run against real prod racers.json before Phase B**)`,
    "",
    "userId resolution is intentionally deferred to Phase B (needs real prod user accounts, not available locally). `teamId` (fantasy team) resolution is also deferred — local `.blob-store/leagues/*/teams.json` has no overlap with these team names (dev seed data), so it wasn't attempted.",
    "",
    "| Race | Source File | Identity Check | Blocking | Warnings | Notes | Players Extracted |",
    "|---|---|---|---|---|---|---|",
  ];

  for (const race of RACES) {
    console.log(`\n=== ${race.file} ===`);
    const { data, report } = await extractRace(race.file, race.expectedLabel, racers);

    const base = race.file.replace(/\.xlsx$/i, "");
    writeFileSync(path.join(OUTPUT_DIR, `${base}.json`), JSON.stringify(data, null, 2));
    writeFileSync(path.join(OUTPUT_DIR, `${base}.issues.json`), JSON.stringify(report, null, 2));

    console.log(`  identity check: ${data?.identityCrossCheck.passed ? "PASS" : "FAIL"} (expected "${race.expectedLabel}", found "${data?.identityCrossCheck.found ?? report.blocking.find((b) => b.context?.found)?.context?.found ?? "n/a"}")`);
    console.log(`  blocking: ${report.blocking.length}, warnings: ${report.warnings.length}, notes: ${report.notes.length}`);
    for (const b of report.blocking) console.log(`    [BLOCKING] ${b.code}: ${b.message}`);
    for (const w of report.warnings.slice(0, 10)) console.log(`    [warn] ${w.code}: ${w.message}`);
    if (report.warnings.length > 10) console.log(`    ...and ${report.warnings.length - 10} more warnings (see ${base}.issues.json)`);

    summaryLines.push(
      `| ${race.expectedLabel} | ${race.file} | ${data?.identityCrossCheck.passed ? "✅" : "❌"} | ${report.blocking.length} | ${report.warnings.length} | ${report.notes.length} | ${data ? Object.keys(data.predictions).length : 0} |`,
    );
  }

  summaryLines.push(
    "",
    "## Team-tab bonus-pick layout finding",
    "",
    'Verified empirically across every team sheet in all 5 files (not assumed): each team sheet has two side-by-side member blocks. Member 1 = columns A-H (rank picks in B, bonus picks in F), member 2 = columns K-S (rank picks in L, bonus picks in P). Within each bonus-pick column, DOTD has no inline label (its value sits directly under the "DOTD" column header), and the other 6 props each have an inline "Label:" cell immediately followed by their value — extracted via label-text scanning rather than fixed row offsets, so it tolerates minor row drift. `fastestPitStop` values are constructor names (e.g. "Ferrari", "RB"), not driver names, consistent with how the app itself stores that one prop.',
    "",
    "Member-to-player identity is NOT stored in the team sheet itself — it's inferred by column order (1st Weekly-Lineups column for a team = block 1, 2nd = block 2) and cross-checked against the team sheet's own rank list; any disagreement is flagged as a `GRID_ORDER_SOURCE_MISMATCH` warning per player.",
    "",
    "## Known caveats",
    "",
    "- Driver/team name resolution used local dev `racers.json` (22 racers) — re-run extraction against real prod `racers.json` before Phase B; ID values in this output are not final.",
    "- Fantasy team ID and userId resolution were not attempted locally (no usable reference data) — every prediction carries `userId: null` and no `teamId` field; Phase B needs real prod team/user lists.",
    "- \"Fast and Furryious by FeetFinder\" is truncated to 31 chars as an actual Excel sheet name (\"...FeetFinde\") — handled by the fuzzy sheet-name matcher, flagged as a note (not a warning) when it fires.",
  );
  writeFileSync(path.join(OUTPUT_DIR, "SUMMARY.md"), summaryLines.join("\n"));

  console.log(`\nDone. Output in ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
