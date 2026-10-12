"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_RING_COLOR, teamLogoSrc } from "@/lib/avatar";
import { AVATAR_SIZES, type AvatarSize } from "./PlayerAvatar";

type TeamLogoProps = {
  leagueId: string;
  teamId: string;
  name: string;
  /** Team color — used for the ring. */
  color?: string | null;
  /** Team logo value from the team ("upload:<version>"), or null for initials. */
  logo?: string | null;
  size?: AvatarSize;
  className?: string;
};

function teamInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0]).toUpperCase();
}

/** A team's logo (or its initials) inside a ring of the team color. Shown wherever the team name appears. */
export function TeamLogo({ leagueId, teamId, name, color, logo, size = "sm", className }: TeamLogoProps) {
  const [broken, setBroken] = useState(false);
  const s = AVATAR_SIZES[size];
  const src = teamLogoSrc(leagueId, teamId, logo);
  const inner = s.px - s.ring * 2;
  const ring = color ?? DEFAULT_RING_COLOR;

  return (
    <span
      role="img"
      aria-label={`${name} logo`}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-[28%] select-none", className)}
      style={{ width: s.px, height: s.px, padding: s.ring, backgroundColor: ring }}
    >
      <span
        className="flex items-center justify-center overflow-hidden rounded-[22%] bg-muted ring-1 ring-background"
        style={{ width: inner, height: inner }}
      >
        {src && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="size-full object-cover" loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <span className={cn("font-semibold leading-none text-muted-foreground", s.text)}>{teamInitials(name)}</span>
        )}
      </span>
    </span>
  );
}
