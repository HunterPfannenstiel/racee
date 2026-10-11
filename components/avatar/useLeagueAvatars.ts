"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { useLeague } from "@/app/context/LeagueContext";
import { useAvatarLeagueScope } from "./AvatarLeagueScope";

export type LeagueAvatar = {
  userId: string;
  name: string;
  image: string | null;
  color: string;
  playerColor: string;
  hidden: boolean;
};

/**
 * Avatars and ring colors for every player in a league, keyed by userId.
 * Uses `leagueId` if given, else the surrounding AvatarLeagueScope, else the active league. One shared, cached request per league, so
 * every avatar on a page costs nothing extra.
 */
export function useLeagueAvatars(leagueId?: string | null) {
  const { activeLeagueId } = useLeague();
  const scopedLeagueId = useAvatarLeagueScope();
  const id = leagueId ?? scopedLeagueId ?? activeLeagueId;
  const query = useQuery(
    orpc.leagues.avatars.list.queryOptions({
      input: { leagueId: id ?? "" },
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }),
  );
  const byUserId: Record<string, LeagueAvatar> = Object.fromEntries((query.data ?? []).map((a) => [a.userId, a]));
  return { byUserId, query, leagueId: id };
}
