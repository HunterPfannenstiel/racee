"use client";

import { PlayerAvatar, type AvatarSize } from "./PlayerAvatar";
import { useLeagueAvatars } from "./useLeagueAvatars";

type LeaguePlayerAvatarProps = {
  userId: string;
  /** Shown as initials until the league's avatars load (and for anyone not found). */
  name: string;
  /** Defaults to the surrounding AvatarLeagueScope, else the active league. */
  leagueId?: string | null;
  /** Used when the player isn't in the league's list (e.g. no active league). */
  fallbackImage?: string | null;
  size?: AvatarSize;
  className?: string;
};

/** A player's avatar with their ring color for one league. Use this anywhere a player's name appears. */
export function LeaguePlayerAvatar({ userId, name, leagueId, fallbackImage, size, className }: LeaguePlayerAvatarProps) {
  const { byUserId } = useLeagueAvatars(leagueId);
  const a = byUserId[userId];
  return (
    <PlayerAvatar
      userId={userId}
      name={name}
      image={a ? a.image : fallbackImage}
      color={a?.color}
      hidden={a?.hidden}
      size={size}
      className={className}
    />
  );
}
