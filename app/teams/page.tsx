"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { useLeague } from "@/app/context/LeagueContext";
import { PageShell } from "@/components/ui/page-shell";
import { QueryError, QueryLoading } from "@/components/ui/query-state";
import { RequireUser } from "@/components/RequireUser";
import {
  ContributionSection,
  LeagueComparison,
  MembersSection,
  RaceByRace,
  TeamHeader,
  TeamPropsSection,
  TeamStatGrid,
  TeamSwitcher,
} from "./sections";

/** Team dashboard for the active league: your team by default, any team via the switcher. */
export default function TeamsPage() {
  const { activeLeagueId } = useLeague();
  // Remember the picked team per league; switching leagues falls back to your own team.
  const [picked, setPicked] = useState<{ leagueId: string; teamId: string } | null>(null);
  const teamId = picked && picked.leagueId === activeLeagueId ? picked.teamId : null;

  const dashboardQuery = useQuery(
    orpc.leagues.teams.dashboard.queryOptions({
      input: { leagueId: activeLeagueId ?? "", teamId },
      enabled: !!activeLeagueId,
    }),
  );
  const select = (id: string) => activeLeagueId && setPicked({ leagueId: activeLeagueId, teamId: id });

  return (
    <PageShell title="Teams">
      <RequireUser>
        {!activeLeagueId ? (
          <p className="text-xs uppercase tracking-widest text-muted-foreground">No leagues yet.</p>
        ) : dashboardQuery.isPending ? (
          <QueryLoading />
        ) : dashboardQuery.isError ? (
          <QueryError error={dashboardQuery.error} onRetry={() => dashboardQuery.refetch()} />
        ) : !dashboardQuery.data.team ? (
          <p className="text-sm text-muted-foreground">This league doesn&apos;t have any teams yet.</p>
        ) : (
          <div className="space-y-6">
            <TeamSwitcher
              leagueId={activeLeagueId}
              teams={dashboardQuery.data.leagueTeams}
              selectedId={dashboardQuery.data.team.id}
              viewerTeamId={dashboardQuery.data.viewerTeamId}
              onSelect={select}
            />
            <TeamHeader leagueId={activeLeagueId} data={dashboardQuery.data} />
            <TeamStatGrid data={dashboardQuery.data} />
            <ContributionSection leagueId={activeLeagueId} data={dashboardQuery.data} />
            <MembersSection leagueId={activeLeagueId} data={dashboardQuery.data} />
            <TeamPropsSection data={dashboardQuery.data} />
            <LeagueComparison leagueId={activeLeagueId} data={dashboardQuery.data} onSelect={select} />
            <RaceByRace leagueId={activeLeagueId} data={dashboardQuery.data} />
          </div>
        )}
      </RequireUser>
    </PageShell>
  );
}
