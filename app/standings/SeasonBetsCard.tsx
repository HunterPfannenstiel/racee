"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { orpc } from "@/lib/orpc/client";
import { shortDay } from "@/components/season-props/SeasonPropInputs";

/** The viewer's year-long bets on the standings page: their pick, and the answer once it's known. */
export function SeasonBetsCard({ leagueId }: { leagueId: string }) {
  const { data } = useQuery(orpc.seasonProps.get.queryOptions({ input: { leagueId } }));
  if (!data || !data.enabled || !data.open || data.questions.length === 0) return null;

  const mine = data.myPicks;
  const missing = data.questions.some((q) => !(mine[q.questionId] ?? "").trim());
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Season bets</h2>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.questions.map((q) => {
          const pick = (mine[q.questionId] ?? "").trim();
          return (
            <div key={q.questionId} className="text-sm">
              <p className="font-semibold">{q.prompt}</p>
              <p className="text-xs text-muted-foreground">
                Your pick: <span className="text-foreground">{pick || "none yet"}</span>
                {(q.answerState === "answered" || q.answerState === "running") && (
                  <>
                    {" · "}
                    {q.answerState === "running" ? "Current answer" : "Answer"}: <span className="text-foreground">{q.correctAnswers.join(", ")}</span>
                    {pick && q.correctAnswers.includes(pick) && " ✓"}
                    {q.answerState === "running" && q.answerUpdatedAt && ` (updated ${shortDay(q.answerUpdatedAt)}, still changing)`}
                  </>
                )}
                {q.answerState === "voided" && " · Thrown out"}
              </p>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground">
          {data.pointsReveal !== "always" && !data.pointsRevealed
            ? "Bonus points are hidden until later in the season. "
            : "Bonus points are included in the totals below. "}
          <Link href="/predict/season" className="underline hover:text-foreground">
            {missing && data.canPick ? "Make your picks" : data.everyone ? "See everyone's picks" : "Season picks"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
