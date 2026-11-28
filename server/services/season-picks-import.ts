import type { SeasonQuestion } from "@/server/domain/season-props";

/** `userId` is set when the commissioner picked the member by hand. */
export type ImportRow = { player: string; picks: Record<string, string>; userId?: string };

export type ImportReport = {
  players: { name: string; matchedAs: string | null; matchedUserId: string | null; saved: number; problems: string[] }[];
  /** Everyone in the league, for choosing a match by hand. */
  members: { userId: string; name: string }[];
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

function editDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** Same person, spelled a bit differently: a nickname that starts the name ("Russ"), an initial ("Dylan A"), or a one-letter typo. */
function similarName(a: string, b: string): boolean {
  const [fa, ...ra] = norm(a).split(" ");
  const [fb, ...rb] = norm(b).split(" ");
  if (!fa || !fb) return false;
  const firstOk = fa.startsWith(fb) || fb.startsWith(fa) || editDistance(fa, fb) <= 1;
  const la = ra.join(" ");
  const lb = rb.join(" ");
  const lastOk = la === lb || (la !== "" && lb !== "" && (la.startsWith(lb) || lb.startsWith(la)));
  return firstOk && lastOk;
}

function findMember<T extends { name: string }>(members: readonly T[], text: string): T | null {
  const hit = findLoose(members, text, (m) => m.name);
  if (hit) return hit;
  const near = members.filter((m) => similarName(m.name, text));
  return near.length === 1 ? near[0] : null;
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
    const member = (row.userId ? members.find((m) => m.userId === row.userId) : null) ?? findMember(members, row.player);
    const problems: string[] = [];
    if (!member) {
      players.push({ name: row.player, matchedAs: null, matchedUserId: null, saved: 0, problems: ["Not in this league (no member with that name)"] });
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
    players.push({ name: row.player, matchedAs: member.name, matchedUserId: member.userId, saved: Object.keys(clean).length, problems });
  }

  return {
    report: {
      players,
      members: members.map((m) => ({ userId: m.userId, name: m.name })),
      unmatchedQuestions: sheetPrompts.filter((p) => !promptToQuestion.has(p)),
      missingQuestions: questions.filter((q) => !used.has(q.questionId)).map((q) => q.prompt),
    },
    picksByUser,
  };
}
