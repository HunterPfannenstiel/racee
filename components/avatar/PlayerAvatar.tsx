"use client";

import { useState } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_RING_COLOR, parseAvatar } from "@/lib/avatar";
import { AVATAR_PRESETS, PresetGlyph } from "./presets";

export const AVATAR_SIZES = {
  xs: { px: 20, ring: 2, text: "text-[9px]" },
  sm: { px: 24, ring: 2, text: "text-[10px]" },
  md: { px: 32, ring: 2, text: "text-xs" },
  lg: { px: 40, ring: 3, text: "text-sm" },
  xl: { px: 64, ring: 3, text: "text-2xl" },
  "2xl": { px: 96, ring: 4, text: "text-4xl" },
  hero: { px: 224, ring: 6, text: "text-7xl" },
} as const;
export type AvatarSize = keyof typeof AVATAR_SIZES;

type PlayerAvatarProps = {
  userId: string;
  name: string;
  /** Avatar value (see lib/avatar.ts). */
  image?: string | null;
  /** Ring color — the player's team color, or their own color in this league. */
  color?: string | null;
  /** Hidden by the commissioner: always shows the generic icon. */
  hidden?: boolean;
  size?: AvatarSize;
  className?: string;
};

/**
 * A player's picture (photo, built-in icon, or initials) inside a colored ring.
 * Pure display — LeaguePlayerAvatar fills in the image and color for a league.
 */
export function PlayerAvatar({ userId, name, image, color, hidden, size = "sm", className }: PlayerAvatarProps) {
  const [broken, setBroken] = useState(false);
  const s = AVATAR_SIZES[size];
  const parsed = hidden ? { kind: "none" as const } : parseAvatar(image, userId);
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const inner = s.px - s.ring * 2;
  const iconPx = Math.round(inner * 0.55);

  let content: React.ReactNode;
  let bg: string | undefined;
  if (hidden) {
    content = <User style={{ width: iconPx, height: iconPx }} className="text-muted-foreground" aria-hidden />;
  } else if (parsed.kind === "photo" && !broken) {
    content = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={parsed.src}
        alt=""
        className="size-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  } else if (parsed.kind === "preset") {
    const preset = AVATAR_PRESETS[parsed.id];
    bg = preset.bg;
    content = <PresetGlyph preset={preset} px={iconPx} />;
  } else {
    content = <span className={cn("font-semibold text-muted-foreground leading-none", s.text)}>{initial}</span>;
  }

  return (
    <span
      role="img"
      aria-label={hidden ? `${name} (picture hidden)` : name}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full select-none", className)}
      style={{ width: s.px, height: s.px, padding: s.ring, backgroundColor: color ?? DEFAULT_RING_COLOR }}
    >
      <span
        className={cn("flex size-full items-center justify-center overflow-hidden rounded-full ring-1 ring-background", !bg && "bg-muted")}
        style={{ backgroundColor: bg, width: inner, height: inner }}
      >
        {content}
      </span>
    </span>
  );
}
