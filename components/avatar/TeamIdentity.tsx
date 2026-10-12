"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { TeamLogo } from "./TeamLogo";
import type { AvatarSize } from "./PlayerAvatar";
import type { AvatarAction } from "./useAvatarClick";

/** A team's logo looked up by id (from the league's cached team list). Tapping opens the team's page. */
export function TeamIdentity({
  leagueId,
  teamId,
  name,
  size,
  className,
  action = "navigate",
}: {
  leagueId: string;
  teamId: string;
  name: string;
  size?: AvatarSize;
  className?: string;
  action?: AvatarAction;
}) {
  const { data: teams } = useQuery(
    orpc.leagues.teams.list.queryOptions({ input: { leagueId }, staleTime: 5 * 60 * 1000 }),
  );
  const team = teams?.find((t) => t.id === teamId);
  return (
    <TeamLogo
      leagueId={leagueId}
      teamId={teamId}
      name={team?.name ?? name}
      color={team?.color}
      logo={team?.logo}
      size={size}
      className={className}
      action={action}
    />
  );
}
