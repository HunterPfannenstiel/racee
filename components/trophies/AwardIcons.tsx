import { cn } from "@/lib/utils";
import { MEDAL_HEX, MEDAL_LABEL, type Medal } from "@/lib/medals";

/**
 * Hand-drawn medal and trophy, in the same 24×24 round-stroke style as the
 * racing icons, but filled in gold / silver / bronze.
 */
type AwardProps = { medal: Medal; className?: string; title?: string };

/** Race medal: ribbon with a round medal and a little checkered stripe. */
export function MedalIcon({ medal, className, title }: AwardProps) {
  const { fill, stroke } = MEDAL_HEX[medal];
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      className={cn("inline-block shrink-0", className)}
      role="img"
      aria-label={title ?? `${MEDAL_LABEL[medal]} medal`}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {title && <title>{title}</title>}
      <path d="M7 2h4l2 6.5H9z" fill="#dc2626" stroke="#7f1d1d" strokeWidth={1.5} />
      <path d="M17 2h-4l-2 6.5h4z" fill="#1d4ed8" stroke="#1e3a8a" strokeWidth={1.5} />
      <circle cx="12" cy="15" r="6.5" fill={fill} stroke={stroke} strokeWidth={2} />
      <circle cx="12" cy="15" r="3.6" fill="none" stroke={stroke} strokeWidth={1.25} />
    </svg>
  );
}

/** Season trophy: two-handled cup on a stepped base. */
export function TrophyIcon({ medal, className, title }: AwardProps) {
  const { fill, stroke } = MEDAL_HEX[medal];
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
      <path d="M7 4.5H4.5a2.5 2.5 0 0 0 0 5H7.5" fill="none" stroke={stroke} strokeWidth={2} />
      <path d="M17 4.5h2.5a2.5 2.5 0 0 1 0 5H16.5" fill="none" stroke={stroke} strokeWidth={2} />
      <path d="M6.5 3h11v4.5a5.5 5.5 0 0 1-11 0z" fill={fill} stroke={stroke} strokeWidth={2} />
      <path d="M12 13v3.5" stroke={stroke} strokeWidth={2} />
      <path d="M9 16.5h6l1 2.5H8z" fill={fill} stroke={stroke} strokeWidth={1.75} />
      <path d="M6.5 19h11v2.5h-11z" fill="#3f3f46" stroke="#18181b" strokeWidth={1.5} />
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
