import Link from "next/link";
import { type StandingsRowData } from "./StandingsGrid";

type Props = {
  rows: StandingsRowData[];
  currentRowId: string | null;
};

export function SeasonStandingsSection({ rows, currentRowId }: Props) {
  const leaderTotal = rows[0]?.total ?? 0;

  return (
    <section>
      <p className="px-4 mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Season Standings
      </p>
      <div className="rounded-lg border border-border overflow-hidden bg-surface">
        {rows.map((row, idx) => {
          const rank = idx + 1;
          const gap = leaderTotal - row.total;
          const isMe = row.id === currentRowId;

          const inner = (
            <div
              className={`relative flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 min-h-[56px] ${
                isMe ? "bg-primary-subtle" : ""
              }`}
            >
              {/* team color accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-0.5 shrink-0"
                style={{ backgroundColor: row.color }}
              />

              {/* rank */}
              <span
                className={`font-mono font-semibold text-sm w-5 text-center shrink-0 ${
                  rank === 1 ? "text-racee-accent" : "text-muted-foreground"
                }`}
              >
                {rank}
              </span>

              {/* name + team */}
              <div className="flex-1 min-w-0">
                <p className={`font-heading text-lg font-bold leading-tight truncate ${isMe ? "text-foreground" : "text-foreground"}`}>
                  {row.label}
                </p>
                {row.teamName && row.teamName !== row.label && (
                  <p className="font-mono text-[11px] text-muted-foreground leading-none mt-0.5 truncate">
                    {row.teamName}
                  </p>
                )}
              </div>

              {/* points + gap */}
              <div className="text-right shrink-0">
                <p className="font-mono font-bold text-base tabular-nums tracking-[-0.02em] text-foreground">
                  {row.total.toLocaleString()}
                </p>
                <p className="font-mono text-[11px] tabular-nums text-muted-foreground leading-none mt-0.5">
                  {gap === 0 ? "—" : `-${gap.toLocaleString()}`}
                </p>
              </div>
            </div>
          );

          return row.linkTo ? (
            <Link key={row.id} href={row.linkTo} className="block hover:bg-subtle transition-colors">
              {inner}
            </Link>
          ) : (
            <div key={row.id}>
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
