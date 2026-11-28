import type { SeasonQuestion } from "@/server/domain/season-props";

export type ImportRow = { player: string; picks: Record<string, string> };

export type ImportReport = {
  players: { name: string; matchedAs: string | null; saved: number; problems: string[] }[];
  /** Spreadsheet questions that matched no question in the league. */
  unmatchedQuestions: string[];
  /** League questions the spreadsheet had nothing for. */
  missingQuestions: string[];
};

export type ImportPlan = {
  report: ImportReport;
  /** What would be saved: user id → question id → answer. */
  picksByUser: Map<string, Record<string, string>>;
};

export function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

/** Exact match first, then one name containing the other (only when that is unambiguous). */
function findLoose<T>(items: readonly T[], text: string, key: (t: T) => string): T | null {
  const n = norm(text);
  if (!n) return null;
  const exact = items.filter((i) => norm(key(i)) === n);
  if (exact.length === 1) return exact[0];
  const loose = items.filter((i) => {
    const k = norm(key(i));
    return k.length > 0 && (k.includes(n) || n.includes(k));
  });
  return loose.length === 1 ? loose[0] : null;
}

/** Matches spreadsheet rows to league members and questions, and checks every answer the way saving would. */
export function planPicksImport(args: {
  rows: readonly ImportRow[];
  members: readonly { userId: string; name: string }[];
  questions: readonly SeasonQuestion[];
  grid: { drivers: readonly string[]; teams: readonly string[] };
}): ImportPlan {
  const { rows, members, questions, grid } = args;
  const sheetPrompts = [...new Set(rows.flatMap((r) => Object.keys(r.picks)))];
  const promptToQuestion = new Map<string, SeasonQuestion>();
  const used = new Set<string>();
  for (const p of sheetPrompts) {
    const q = findLoose(questions.filter((x) => !used.has(x.questionId)), p, (x) => x.prompt);
    if (q) {
      promptToQuestion.set(p, q);
      used.add(q.questionId);
    }
  }

  const players: ImportReport["players"] = [];
  const picksByUser = new Map<string, Record<string, string>>();
  for (const row of rows) {
    const member = findLoose(members, row.player, (m) => m.name);
    const problems: string[] = [];
    if (!member) {
      players.push({ name: row.player, matchedAs: null, saved: 0, problems: ["Not in this league (no member with that name)"] });
      continue;
    }
    const clean: Record<string, string> = {};
    for (const [prompt, raw] of Object.entries(row.picks)) {
      const q = promptToQuestion.get(prompt);
      const value = raw.trim();
      if (!q || !value) continue;
      if (q.kind === "number") {
        if (Number.isFinite(Number(value))) clean[q.questionId] = String(Number(value));
        else problems.push(`"${q.prompt}": "${value}" isn't a number`);
        continue;
      }
      const choices = q.kind === "driver" ? grid.drivers : q.kind === "team" ? grid.teams : q.options;
      const hit = findLoose(choices, value, (c) => c);
      if (hit) clean[q.questionId] = hit;
      else problems.push(`"${q.prompt}": "${value}" isn't one of the choices`);
    }
    picksByUser.set(member.userId, clean);
    players.push({ name: row.player, matchedAs: member.name, saved: Object.keys(clean).length, problems });
  }

  return {
    report: {
      players,
      unmatchedQuestions: sheetPrompts.filter((p) => !promptToQuestion.has(p)),
      missingQuestions: questions.filter((q) => !used.has(q.questionId)).map((q) => q.prompt),
    },
    picksByUser,
  };
}
