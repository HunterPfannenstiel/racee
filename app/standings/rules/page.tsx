"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { QueryError } from "@/components/ui/query-state";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useUser } from "@/app/context/UserContext";
import { useLeague } from "@/app/context/LeagueContext";
import { orpc } from "@/lib/orpc/client";
import { PROP_META } from "@/lib/props";
import { type League, type PropName } from "@/lib/schemas";

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function pts(n: number) {
  return `${n} pt${n === 1 ? "" : "s"}`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{children}</p>;
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-sm flex-1">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-right">{value}</span>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

function RulesCard({ league }: { league: League }) {
  const stageCount = league.stageCount ?? 0;
  const teamPoints = league.teamPositionPoints ?? [];

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{league.name} — League Rules</h2>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1">
          <SectionTitle>Placement Points</SectionTitle>
          <Note>Points for each driver you place, based on how close your pick is to where they actually finish.</Note>
          {league.placementPoints.length === 0 ? (
            <Note>No tiers set.</Note>
          ) : (
            <div className="divide-y divide-border">
              {league.placementPoints.map((p, i) => (
                <Row key={i} label={i === 0 ? "Exact match" : `Off by ${i}`} value={pts(p)} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <SectionTitle>Scoring Depth</SectionTitle>
          <Row
            label="Positions scored"
            value={league.scoringDepth ? `Top ${league.scoringDepth}` : "All positions"}
          />
        </div>

        <div className="space-y-1">
          <SectionTitle>Mulligans</SectionTitle>
          <Row label="Lowest races dropped" value={league.mulliganCount} />
          <Note>
            {league.mulliganCount === 0
              ? "Every race counts toward your total."
              : `Your ${league.mulliganCount === 1 ? "lowest race is" : `${league.mulliganCount} lowest races are`} dropped from your total.`}
          </Note>
        </div>

        <div className="space-y-1">
          <SectionTitle>Stages</SectionTitle>
          <Row label="Stages in the season" value={stageCount === 0 ? "None" : stageCount} />
        </div>

        <div className="space-y-1">
          <SectionTitle>Prop Point Values</SectionTitle>
          <div className="divide-y divide-border">
            {(Object.keys(PROP_META) as PropName[]).map((prop) => (
              <Row key={prop} label={PROP_META[prop].label} value={pts(league.propPointValues[prop])} />
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <SectionTitle>Team Scoring</SectionTitle>
          {teamPoints.length === 0 ? (
            <Note>Off — this league has no constructor standings.</Note>
          ) : (
            <>
              <Note>Points each team earns per race based on where it finishes among the teams.</Note>
              <div className="divide-y divide-border">
                {teamPoints.map((p, i) => (
                  <Row key={i} label={`${ordinal(i + 1)} place`} value={pts(p)} />
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeagueRulesPage() {
  const { user, isLoading: userLoading } = useUser();
  const { activeLeagueId } = useLeague();
  const enabled = !!user && !!activeLeagueId;
  const leagueQuery = useQuery(
    orpc.leagues.get.queryOptions({ input: { leagueId: activeLeagueId ?? "" }, enabled }),
  );

  return (
    <PageShell title="League Rules">
      <Link
        href="/standings"
        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Standings
      </Link>
      {userLoading || (enabled && leagueQuery.isPending) ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : !activeLeagueId ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">No leagues yet.</p>
      ) : leagueQuery.isError ? (
        <QueryError error={leagueQuery.error} onRetry={() => leagueQuery.refetch()} />
      ) : leagueQuery.data ? (
        <RulesCard league={leagueQuery.data} />
      ) : null}
    </PageShell>
  );
}
