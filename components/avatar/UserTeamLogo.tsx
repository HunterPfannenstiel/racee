"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { useLeague } from "@/app/context/LeagueContext";
import { useAvatarLeagueScope } from "./AvatarLeagueScope";
import { TeamLogo } from "./TeamLogo";
import type { AvatarSize } from "./PlayerAvatar";

type Props = {
  userId: string;
  /** Defaults to the surrounding AvatarLeagueScope, else the active league. */
  leagueId?: string | null;
  size?: AvatarSize;
  className?: string;
};

/**
 * The logo of whichever team `userId` is on in a league — for spots that only
 * know the player, like a team-name line under their name. Renders nothing if
 * they aren't on a team.
 */
export function UserTeamLogo({ userId, leagueId, size = "xs", className }: Props) {
  const { activeLeagueId } = useLeague();
  const scoped = useAvatarLeagueScope();
  const id = leagueId ?? scoped ?? activeLeagueId;
  const { data: teams } = useQuery(
    orpc.leagues.teams.list.queryOptions({ input: { leagueId: id ?? "" }, enabled: !!id, staleTime: 5 * 60 * 1000 }),
  );
  const team = teams?.find((t) => t.memberIds.includes(userId));
  if (!id || !team) return null;
  return (
    <TeamLogo leagueId={id} teamId={team.id} name={team.name} color={team.color} logo={team.logo} size={size} className={className} action="navigate" />
  );
}
