"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon, XIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { QueryError, QueryLoading } from "@/components/ui/query-state";
import { orpc } from "@/lib/orpc/client";
import { shortDay } from "@/components/season-props/SeasonPropInputs";

/** Standings → Season bets: your own year-long picks against the answers. Other players' picks are never shown. */
export function SeasonBetsTab({ leagueId }: { leagueId: string }) {
  const query = useQuery(orpc.seasonProps.get.queryOptions({ input: { leagueId } }));
  if (query.isPending) return <QueryLoading />;
  if (query.isError) return <QueryError error={query.error} onRetry={() => query.refetch()} />;
  const data = query.data;

  const note = data.pointsRevealed
    ? data.pointsReveal === "always"
      ? "Your points are added to your total as questions are answered."
      : "Your points are now included in your total."
    : data.pointsReveal === "racesLeft"
      ? data.revealAfterRace
        ? `Your points will be added to your total starting after the ${data.revealAfterRace}.`
        : `Your points will be added to your total when ${data.revealRacesLeft} race${data.revealRacesLeft === 1 ? " is" : "s are"} left.`
      : "Your points will be added to your total when the season ends.";

  return (
    <div className="space-y-3">
      <p className="rounded-md border border-border bg-subtle px-4 py-3 text-sm">{note}</p>
      {data.myPoints && (
        <p className="text-sm">
          Your season bets so far: <span className="font-semibold">{data.myPoints.driverPoints}</span> for the Drivers&apos; Cup
          {data.myPoints.teamPoints > 0 && (
            <>
              {" "}and <span className="font-semibold">{data.myPoints.teamPoints}</span> for your team
            </>
          )}
          .
        </p>
      )}

      {data.questions.map((q) => {
        const pick = (data.myPicks[q.questionId] ?? "").trim();
        const verdict = data.myByQuestion[q.questionId];
        return (
          <Card key={q.questionId}>
            <CardContent className="space-y-1 pt-6">
              <p className="text-sm font-semibold">{q.prompt}</p>
              <p className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Your pick:</span> {pick || "none yet"}
                {pick && verdict === true && <CheckIcon className="size-4 text-green-500" aria-label="Right" />}
                {pick && verdict === false && <XIcon className="size-4 text-destructive" aria-label="Wrong" />}
              </p>
              <p className="text-xs text-muted-foreground">
                {q.answerState === "pending" && "No answer yet."}
                {q.answerState === "voided" && "Thrown out: nobody scores this one."}
                {(q.answerState === "answered" || q.answerState === "running") && (
                  <>
                    {q.answerState === "running" ? "Current answer" : "Answer"}:{" "}
                    <span className="text-foreground">{q.correctAnswers.join(", ")}</span>
                    {q.answerState === "running" && q.answerUpdatedAt && ` (updated ${shortDay(q.answerUpdatedAt)}, still changing)`}
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        );
      })}

      {data.canPick && (
        <Link href="/predict/season" className="inline-block text-sm underline hover:text-foreground">
          {data.questions.some((q) => !(data.myPicks[q.questionId] ?? "").trim()) ? "Make your picks" : "Change your picks"}
        </Link>
      )}
    </div>
  );
}
