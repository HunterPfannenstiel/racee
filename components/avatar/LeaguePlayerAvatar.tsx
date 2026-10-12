"use client";

import { parseAvatar } from "@/lib/avatar";
import { useUser } from "@/app/context/UserContext";
import { PlayerAvatar, type AvatarSize } from "./PlayerAvatar";
import { PhotoLightbox } from "./PhotoLightbox";
import { useAvatarClick, type AvatarAction } from "./useAvatarClick";
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
  /** Tapping it: open the player's page (default), blow the picture up, or nothing. */
  action?: AvatarAction;
};

/** A player's avatar with their ring color for one league. Use this anywhere a player's name appears. */
export function LeaguePlayerAvatar({ userId, name, leagueId, fallbackImage, size, className, action = "navigate" }: LeaguePlayerAvatarProps) {
  const { byUserId } = useLeagueAvatars(leagueId);
  const { user } = useUser();
  const a = byUserId[userId];
  const image = a ? a.image : fallbackImage;
  const click = useAvatarClick(action, `/players/${userId}`);
  // Only someone else's uploaded photo can be reported (not icons, initials, or hidden pictures).
  const reportable = !a?.hidden && userId !== user?.id && parseAvatar(image, userId).kind === "photo";

  const avatar = (
    <PlayerAvatar
      userId={userId}
      name={name}
      image={image}
      color={a?.color}
      hidden={a?.hidden}
      size={size}
      className={className}
    />
  );
  if (action === "none") return avatar;
  return (
    <>
      <span {...click.props} className={`inline-flex shrink-0 ${click.props.className ?? ""}`} aria-label={action === "zoom" ? `View ${name}'s picture` : `Go to ${name}'s page`}>
        {avatar}
      </span>
      {action === "zoom" && (
        <PhotoLightbox
          open={click.zoomed}
          onClose={click.close}
          title={a?.name ?? name}
          reportTarget={reportable ? { kind: "avatar", userId } : null}
        >
          <PlayerAvatar userId={userId} name={name} image={image} color={a?.color} hidden={a?.hidden} size="hero" />
        </PhotoLightbox>
      )}
    </>
  );
}
