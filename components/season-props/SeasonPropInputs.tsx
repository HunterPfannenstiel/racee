"use client";

import { XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Grid = { drivers: string[]; teams: string[] };
export type QuestionKind = "choice" | "driver" | "team" | "number";

export const KIND_LABEL: Record<QuestionKind, string> = {
  choice: "Pick from a list",
  driver: "Pick a driver",
  team: "Pick a team",
  number: "A number",
};

const NONE = "__none__";

/** The choices a question offers: its own list, or the season's drivers / teams. */
export function choicesFor(kind: QuestionKind, options: readonly string[], grid: Grid): string[] {
  if (kind === "driver") return grid.drivers;
  if (kind === "team") return grid.teams;
  if (kind === "choice") return [...options];
  return [];
}

/** A player's single answer to a question. */
export function PickInput({
  kind,
  options,
  grid,
  value,
  onChange,
  disabled,
}: {
  kind: QuestionKind;
  options: readonly string[];
  grid: Grid;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  if (kind === "number") {
    return (
      <Input
        type="number"
        inputMode="decimal"
        value={value}
        disabled={disabled}
        placeholder="Your number"
        className="w-40"
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  const choices = choicesFor(kind, options, grid);
  return (
    <Select value={value || NONE} disabled={disabled} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
      <SelectTrigger className="w-full sm:w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>No pick yet</SelectItem>
        {choices.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** The correct answer(s) to a question: several are allowed (ties). */
export function AnswerEditor({
  kind,
  options,
  grid,
  answers,
  onChange,
}: {
  kind: QuestionKind;
  options: readonly string[];
  grid: Grid;
  answers: string[];
  onChange: (answers: string[]) => void;
}) {
  if (kind === "number") {
    return (
      <Input
        type="number"
        inputMode="decimal"
        value={answers[0] ?? ""}
        placeholder="Correct number"
        className="w-40"
        onChange={(e) => onChange(e.target.value === "" ? [] : [e.target.value])}
      />
    );
  }
  const choices = choicesFor(kind, options, grid).filter((c) => !answers.includes(c));
  return (
    <div className="flex flex-wrap items-center gap-2">
      {answers.map((a) => (
        <span key={a} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs">
          {a}
          <button type="button" aria-label={`Remove ${a}`} onClick={() => onChange(answers.filter((x) => x !== a))}>
            <XIcon className="size-3" />
          </button>
        </span>
      ))}
      <Select value={NONE} onValueChange={(v) => v !== NONE && onChange([...answers, v])}>
        <SelectTrigger size="sm" className="w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{answers.length === 0 ? "Set the correct answer…" : "Add a tied answer…"}</SelectItem>
          {choices.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Options typed as one comma-separated line. */
export function parseOptions(text: string): string[] {
  return [...new Set(text.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 30);
}

/** A running answer not touched for this many days is flagged to the admin. */
export const STALE_DAYS = 21;

export function daysSince(iso: string | null, now: number = Date.now()): number | null {
  if (!iso) return null;
  return Math.floor((now - new Date(iso).getTime()) / 86_400_000);
}

export function shortDay(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
}

/**
 * Final answer or a running one (the answer so far, which counts now and can be
 * changed as the season goes), with when it was last updated.
 */
export function AnswerStatusControl({
  status,
  updatedAt,
  hasAnswer,
  onChange,
}: {
  status: "running" | "final";
  updatedAt: string | null;
  hasAnswer: boolean;
  onChange: (status: "running" | "final") => void;
}) {
  const age = daysSince(updatedAt);
  const stale = status === "running" && hasAnswer && age !== null && age >= STALE_DAYS;
  return (
    <div className="space-y-1 pt-1">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Select value={status} onValueChange={(v) => onChange(v as "running" | "final")}>
          <SelectTrigger size="sm" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="final">Final answer</SelectItem>
            <SelectItem value="running">Running answer (still changing)</SelectItem>
          </SelectContent>
        </Select>
        {hasAnswer && updatedAt && <span className="text-muted-foreground">Updated {shortDay(updatedAt)}</span>}
      </div>
      {status === "running" && hasAnswer && (
        <p className="text-[10px] text-muted-foreground">
          Counts in the standings now. Players see it as &quot;current answer&quot;. Leagues can&apos;t release their finale until it&apos;s final.
        </p>
      )}
      {stale && <p className="text-[10px] text-amber-500">Not updated in {age} days. Check whether it has changed.</p>}
    </div>
  );
}
