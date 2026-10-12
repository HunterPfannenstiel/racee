"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { PageShell } from "@/components/ui/page-shell";
import { QueryLoading, QueryError } from "@/components/ui/query-state";
import { useLeague } from "@/app/context/LeagueContext";
import { FrontShelf, TrophyShelf } from "@/components/trophies/TrophyShelf";
import { PlayerHeader } from "./PlayerHeader";
import { StatStrip } from "./StatStrip";
import { PropAccuracyBars } from "./PropAccuracyBars";
import { PickFeed } from "./PickFeed";

export default function PlayerProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { activeLeagueId } = useLeague();
  const shelfQuery = useQuery(orpc.history.shelf.queryOptions({ input: { userId } }));

  // Opens on the league you're in (when the player plays in it), with an "All leagues" switch.
  const [allLeagues, setAllLeagues] = useState(false);
  const scopedLeague = shelfQuery.data?.leagues.find((l) => l.leagueId === activeLeagueId) ?? null;
  const leagueId = !allLeagues && scopedLeague ? scopedLeague.leagueId : null;

  const profileStatsQuery = useQuery(
    orpc.players.profileStats.queryOptions({
      input: { userId, leagueId },
      enabled: shelfQuery.isSuccess || shelfQuery.isError,
    }),
  );

  if (profileStatsQuery.isPending) {
    return (
      <PageShell title="PROFILE">
        <QueryLoading />
      </PageShell>
    );
  }

  if (profileStatsQuery.isError) {
    return (
      <PageShell title="PROFILE">
        <QueryError error={profileStatsQuery.error} onRetry={() => profileStatsQuery.refetch()} />
      </PageShell>
    );
  }

  const data = profileStatsQuery.data;

  return (
    <PageShell title="PROFILE">
      <div className="space-y-8">
        <PlayerHeader player={data.player} summary={data.summary} />
        {shelfQuery.data && (
          <FrontShelf leagues={shelfQuery.data.leagues} featuredTrophyKeys={shelfQuery.data.featuredTrophyKeys} />
        )}

        {scopedLeague && (
          <div className="flex items-center gap-1">
            {[
              { all: false, label: scopedLeague.name },
              { all: true, label: "All leagues" },
            ].map((opt) => (
              <button
                key={String(opt.all)}
                onClick={() => setAllLeagues(opt.all)}
                className={`max-w-[60%] truncate font-mono text-sm font-semibold uppercase tracking-[0.06em] px-4 min-h-[44px] rounded-md transition-colors ${
                  allLeagues === opt.all ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {shelfQuery.data && <TrophyShelf leagues={shelfQuery.data.leagues} leagueId={leagueId} />}
        <StatStrip summary={data.summary} propAccuracy={data.propAccuracy} />
        <PropAccuracyBars propAccuracy={data.propAccuracy} />
        <PickFeed pickFeed={data.pickFeed} racersById={data.racersById} />
      </div>
    </PageShell>
  );
}
