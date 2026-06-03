"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/ui/page-shell";
import { Spinner } from "@/components/ui/spinner";
import type { UserProfileStatsResult } from "@/server/queries/user-profile-stats/IUserProfileStatsQuery";
import { PlayerHeader } from "./PlayerHeader";
import { StatStrip } from "./StatStrip";
import { PropAccuracyBars } from "./PropAccuracyBars";
import { PickFeed } from "./PickFeed";

export default function PlayerProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [data, setData] = useState<UserProfileStatsResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setData(null);
    fetch(`/api/players/${userId}`)
      .then((r) => r.json())
      .then((d: UserProfileStatsResult) => {
        setData(d);
        setLoading(false);
      });
  }, [userId]);

  return (
    <PageShell title="PROFILE">
      {loading ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="w-4 h-4" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : !data ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">Player not found.</p>
      ) : (
        <div className="space-y-8">
          <PlayerHeader player={data.player} summary={data.summary} />
          <StatStrip summary={data.summary} propAccuracy={data.propAccuracy} />
          <PropAccuracyBars propAccuracy={data.propAccuracy} />
          <PickFeed pickFeed={data.pickFeed} racersById={data.racersById} />
        </div>
      )}
    </PageShell>
  );
}
