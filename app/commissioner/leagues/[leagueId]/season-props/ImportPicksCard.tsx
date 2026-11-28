"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { parsePicksSheet } from "@/lib/parse-picks-sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Loads many players' season picks from a downloaded spreadsheet (.csv) in one go. Check first, then save. */
export function ImportPicksCard({ leagueId }: { leagueId: string }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<ReturnType<typeof parsePicksSheet> | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Record<string, string>>({});

  const run = useMutation(
    orpc.seasonProps.importPicks.mutationOptions({
      onSuccess: (r) => {
        setError(null);
        if (r.saved) queryClient.invalidateQueries({ queryKey: orpc.seasonProps.key() });
      },
      onError: (e) => setError(e instanceof Error && e.message ? e.message : "Couldn't read that."),
    }),
  );
  const report = run.data;

  async function onFile(file: File | undefined) {
    if (!file) return;
    run.reset();
    setChosen({});
    setFileName(file.name);
    const parsed = parsePicksSheet(await file.text());
    setRows(parsed);
    if (parsed.length === 0) {
      setError("Couldn't find any players or picks in that file. Download the sheet tab as .csv and try again.");
      return;
    }
    run.mutate({ leagueId, apply: false, rows: parsed });
  }

  const withChoices = (list: NonNullable<typeof rows>) => list.map((r) => (chosen[r.player] ? { ...r, userId: chosen[r.player] } : r));
  const problems = report ? report.players.filter((p) => p.problems.length > 0) : [];
  const canSave = !!report && !report.saved && report.players.some((p) => p.matchedAs);

  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Load picks from a spreadsheet</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-xs text-muted-foreground">
          Download your sheet as a .csv (File → Download → Comma-separated values) and choose it here. You&apos;ll see what matched before
          anything is saved. Players are matched by name (nicknames and short forms are fine); any that don&apos;t match get a dropdown so you can choose who they are. They need to have joined this league first. The league gets one notice that picks
          were loaded, never what they are.
        </p>
        <input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} className="text-xs" />
        {fileName && rows && <p className="text-xs text-muted-foreground">{fileName}: {rows.length} players found.</p>}
        {run.isPending && <Spinner className="w-4 h-4" />}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {report && (
          <div className="space-y-3">
            <div className="divide-y divide-border rounded-sm border border-border">
              {report.players.map((p) => (
                <div key={p.name} className="px-3 py-2 text-xs">
                  <span className="font-semibold">{p.name}</span>
                  {p.matchedAs ? (
                    <span className="text-muted-foreground">
                      {p.matchedAs !== p.name ? ` (matched ${p.matchedAs})` : ""}: {p.saved} picks{report.saved ? " saved" : ""}
                    </span>
                  ) : (
                    <span className="text-destructive"> isn&apos;t matched to anyone in this league</span>
                  )}
                  {!p.matchedAs || chosen[p.name] ? (
                    <Select
                      value={chosen[p.name] ?? ""}
                      onValueChange={(v) => {
                        const next = { ...chosen, [p.name]: v };
                        setChosen(next);
                        if (rows) run.mutate({ leagueId, apply: false, rows: rows.map((r) => (next[r.player] ? { ...r, userId: next[r.player] } : r)) });
                      }}
                    >
                      <SelectTrigger size="sm" className="mt-1 w-full sm:w-72">
                        <SelectValue placeholder="Choose who this is…" />
                      </SelectTrigger>
                      <SelectContent>
                        {report.members.map((m) => (
                          <SelectItem key={m.userId} value={m.userId}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                  {p.problems.map((x) => (
                    <p key={x} className="text-destructive">{x}</p>
                  ))}
                </div>
              ))}
            </div>
            {report.unmatchedQuestions.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  Not matched to any league question (rename it in the sheet or the league to match): {report.unmatchedQuestions.join("; ")}
                </AlertDescription>
              </Alert>
            )}
            {report.missingQuestions.length > 0 && (
              <p className="text-xs text-muted-foreground">No answers in the sheet for: {report.missingQuestions.join("; ")}</p>
            )}
            {canSave && (
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => rows && run.mutate({ leagueId, apply: true, rows: withChoices(rows) })} disabled={run.isPending}>
                  Save these picks{problems.length > 0 ? " (skipping the ones with problems)" : ""}
                </Button>
                <span className="text-xs text-muted-foreground">Replaces each matched player&apos;s picks.</span>
              </div>
            )}
            {report.saved && <p className="text-xs text-muted-foreground">Saved.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
