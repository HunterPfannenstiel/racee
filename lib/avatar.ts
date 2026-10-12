/**
 * Player avatars — shared by server and client.
 *
 * The user's avatar is stored in the account's `image` column as one of:
 *   "preset:<id>"      one of the built-in icons below
 *   "upload:<version>" a photo they uploaded, served from /api/avatar/<userId>
 * Anything else (or null) shows their initials. That includes a picture copied
 * from their sign-in provider (e.g. Google), which is ignored on purpose so a
 * player's real photo is never shown unless they upload one themselves.
 */

export const AVATAR_PRESET_IDS = [
  "car", "flag", "helmet", "steering", "tyre", "lights",
  "roadcar", "safetycar", "cone", "racingline", "wind", "gauge",
  "timer", "bolt", "flame", "trophy", "medal", "crown",
  "wrench", "hammer", "gearbox", "fuel", "ers", "key",
  "p1", "drs", "boxbox", "pit", "vroom", "sendit",
] as const;

/** Retired icons (non-racing) map to their closest racing replacement, so nobody's picture disappears. */
const RETIRED_PRESETS: Record<string, AvatarPresetId> = {
  skull: "helmet",
  ghost: "steering",
  mountain: "tyre",
  swords: "wrench",
  shield: "helmet",
  target: "racingline",
  star: "trophy",
  rocket: "vroom",
};
export type AvatarPresetId = (typeof AVATAR_PRESET_IDS)[number];

export type ParsedAvatar =
  | { kind: "preset"; id: AvatarPresetId }
  | { kind: "photo"; src: string }
  | { kind: "none" };

export const MAX_AVATAR_UPLOAD_BYTES = 300_000;

export function isAvatarPresetId(id: string): id is AvatarPresetId {
  return (AVATAR_PRESET_IDS as readonly string[]).includes(id);
}

export function parseAvatar(image: string | null | undefined, userId: string): ParsedAvatar {
  if (!image) return { kind: "none" };
  if (image.startsWith("preset:")) {
    const raw = image.slice("preset:".length);
    const id = RETIRED_PRESETS[raw] ?? raw;
    return isAvatarPresetId(id) ? { kind: "preset", id } : { kind: "none" };
  }
  if (image.startsWith("upload:")) {
    const version = encodeURIComponent(image.slice("upload:".length));
    return { kind: "photo", src: `/api/avatar/${encodeURIComponent(userId)}?v=${version}` };
  }
  return { kind: "none" };
}

/** Neutral ring for anyone without a league color (or outside a league). */
export const DEFAULT_RING_COLOR = "#6b7280";

/**
 * Colors auto-assigned to players who aren't on a team. Picked to be easy to
 * tell apart on a dark background.
 */
export const PLAYER_COLOR_PALETTE = [
  "#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316",
  "#06b6d4", "#ec4899", "#84cc16", "#6366f1", "#14b8a6", "#f43f5e",
  "#0ea5e9", "#d946ef", "#facc15", "#10b981", "#8b5cf6", "#fb923c",
  "#2dd4bf", "#e11d48", "#65a30d", "#7c3aed", "#0891b2", "#c026d3",
] as const;

/**
 * A team's logo URL, or null. The logo value is "upload:<version>"; the
 * version changes on every upload so browsers don't show a stale cached logo.
 */
export function teamLogoSrc(leagueId: string, teamId: string, logo: string | null | undefined): string | null {
  if (!logo?.startsWith("upload:")) return null;
  const version = encodeURIComponent(logo.slice("upload:".length));
  return `/api/team-logo/${encodeURIComponent(leagueId)}/${encodeURIComponent(teamId)}?v=${version}`;
}
