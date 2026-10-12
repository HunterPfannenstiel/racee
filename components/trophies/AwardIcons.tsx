"use client";

import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { MEDAL_HEX, MEDAL_LABEL, MEDAL_PLACE, type Medal } from "@/lib/medals";

/**
 * Hand-drawn medal and trophy, in the same 24×24 round-stroke style as the
 * racing icons, but filled in gold / silver / bronze.
 */
type AwardProps = { medal: Medal; className?: string; title?: string };

/** Race medal: striped V ribbon, a little loop, and a round medal with its place (1, 2, 3). */
export function MedalIcon({ medal, className, title }: AwardProps) {
  const { fill, light, stroke, text } = MEDAL_HEX[medal];
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      className={cn("inline-block shrink-0", className)}
      role="img"
      aria-label={title ?? `${MEDAL_LABEL[medal]} medal`}
      strokeLinejoin="round"
    >
      {title && <title>{title}</title>}
      {/* ribbon */}
      <path d="M4.4 1h4.3l4.4 7.6H8.8z" fill={stroke} />
      <path d="M6.2 1h1.4l4.3 7.6h-1.4z" fill={light} />
      <path d="M19.6 1h-4.3l-4.4 7.6h4.3z" fill={stroke} />
      <path d="M17.8 1h-1.4l-4.3 7.6h1.4z" fill={light} />
      {/* loop */}
      <rect x="9.9" y="7.4" width="4.2" height="2.6" rx="0.7" fill="none" stroke={stroke} strokeWidth="1" />
      {/* medal */}
      <circle cx="12" cy="15.8" r="7" fill={stroke} />
      <circle cx="12" cy="15.8" r="5.8" fill={fill} />
      <path d="M7.6 14.6a4.6 4.6 0 0 1 3.3-3.3" fill="none" stroke={light} strokeWidth="1" strokeLinecap="round" />
      <text
        x="12"
        y="15.8"
        dy="0.36em"
        textAnchor="middle"
        fontSize="7.6"
        fontWeight="900"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fill={text}
      >
        {MEDAL_PLACE[medal]}
      </text>
    </svg>
  );
}

/** Custom trophy pictures the admin uploaded (shared, rarely changes). */
function useTrophyArt() {
  return useQuery({ ...orpc.history.trophyArt.queryOptions(), staleTime: 10 * 60 * 1000 }).data;
}

/** Season trophy: the admin's custom picture for the tier if there is one, else the hand-drawn cup. */
export function TrophyIcon({ medal, className, title }: AwardProps) {
  const art = useTrophyArt();
  const custom = art?.[medal];
  if (custom?.startsWith("upload:")) {
    const label = title ?? `${MEDAL_LABEL[medal]} trophy`;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- tiny auth-gated icon, next/image adds nothing here
      <img
        src={`/api/trophy-art/${medal}?v=${encodeURIComponent(custom.slice(7))}`}
        alt={label}
        title={title}
        className={cn("inline-block shrink-0 object-contain", className)}
      />
    );
  }
  return <DrawnTrophy medal={medal} className={className} title={title} />;
}

/** The built-in trophy: two-handled cup with its place (1, 2, 3), on a stepped base. */
export function DrawnTrophy({ medal, className, title }: AwardProps) {
  const { fill, light, stroke, text } = MEDAL_HEX[medal];
  const line = { stroke, strokeWidth: 0.7 };
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      className={cn("inline-block shrink-0", className)}
      role="img"
      aria-label={title ?? `${MEDAL_LABEL[medal]} trophy`}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {title && <title>{title}</title>}
      {/* handles */}
      <path d="M6.8 5.6H5.1C3 5.6 3.1 9.9 5.6 11.4l2.3 1.2M17.2 5.6h1.7c2.1 0 2 4.3-.5 5.8l-2.3 1.2" fill="none" stroke={stroke} strokeWidth="2.6" />
      <path d="M6.8 5.6H5.1C3 5.6 3.1 9.9 5.6 11.4l2.3 1.2M17.2 5.6h1.7c2.1 0 2 4.3-.5 5.8l-2.3 1.2" fill="none" stroke={fill} strokeWidth="1.3" />
      {/* cup */}
      <path d="M6.4 4.4h11.2v4.6a5.6 5.6 0 0 1-11.2 0z" fill={fill} {...line} />
      <path d="M8.1 6v2.6a3.6 3.6 0 0 0 1 2.5" fill="none" stroke={light} strokeWidth="0.9" />
      <rect x="5.6" y="2.4" width="12.8" height="2.2" rx="0.8" fill={fill} {...line} />
      <text
        x="12"
        y="8.7"
        dy="0.36em"
        textAnchor="middle"
        fontSize="6.4"
        fontWeight="900"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fill={text}
      >
        {MEDAL_PLACE[medal]}
      </text>
      {/* stem and base */}
      <rect x="10.8" y="14.4" width="2.4" height="1" rx="0.4" fill={fill} {...line} />
      <path d="M10.7 15.4h2.6l.7 2.1H10z" fill={fill} {...line} />
      <rect x="8.8" y="17.5" width="6.4" height="1.4" rx="0.5" fill={fill} {...line} />
      <rect x="7.8" y="18.9" width="8.4" height="2.4" rx="0.5" fill={fill} {...line} />
      <rect x="7" y="21.2" width="10" height="1.3" rx="0.6" fill={fill} {...line} />
    </svg>
  );
}

/** Compact "🥇2 🥈1 🥉0" tally. Zero counts are shown faded so columns line up. */
export function AwardTally({
  counts,
  kind = "medal",
  size = "sm",
  hideZeros = false,
}: {
  counts: { gold: number; silver: number; bronze: number };
  kind?: "medal" | "trophy";
  size?: "sm" | "md";
  hideZeros?: boolean;
}) {
  const Icon = kind === "trophy" ? TrophyIcon : MedalIcon;
  const icon = size === "md" ? "size-5" : "size-3.5";
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap tabular-nums">
      {(["gold", "silver", "bronze"] as const).map((m) =>
        hideZeros && counts[m] === 0 ? null : (
          <span key={m} className={cn("inline-flex items-center gap-0.5", counts[m] === 0 && "opacity-35")}>
            <Icon medal={m} className={icon} />
            <span className={size === "md" ? "text-sm font-semibold" : "text-xs"}>{counts[m]}</span>
          </span>
        ),
      )}
    </span>
  );
}
