"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { PageShell } from "@/components/ui/page-shell";
import { QueryLoading, QueryError } from "@/components/ui/query-state";
import { PlayerHeader } from "./PlayerHeader";
import { StatStrip } from "./StatStrip";
import { PropAccuracyBars } from "./PropAccuracyBars";
import { PickFeed } from "./PickFeed";

export default function PlayerProfilePage() {
  const { userId } = useParams<{ userId: string }>();

  const profileStatsQuery = useQuery(
    orpc.players.profileStats.queryOptions({
      input: { userId },
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
        <StatStrip summary={data.summary} propAccuracy={data.propAccuracy} />
        <PropAccuracyBars propAccuracy={data.propAccuracy} />
        <PickFeed pickFeed={data.pickFeed} racersById={data.racersById} />
      </div>
    </PageShell>
  );
}
