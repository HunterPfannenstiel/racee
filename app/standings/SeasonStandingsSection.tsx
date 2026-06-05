"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { type StandingsRowData } from "./StandingsGrid";

type Props = {
  rows: StandingsRowData[];
  currentRowId: string | null;
};

export function SeasonStandingsSection({ rows, currentRowId }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
          const isExpanded = expandedId === row.id;
          const isExpandable = (row.memberScores?.length ?? 0) > 0;
          const members = isExpanded ? (row.memberScores ?? null) : null;

          const rowEl = (
            <div
              className={`relative flex items-center gap-3 px-4 py-3 border-b border-border min-h-[56px] ${
                isMe ? "bg-primary-subtle" : ""
              } ${isExpandable ? "cursor-pointer select-none" : ""}`}
              onClick={isExpandable ? () => setExpandedId(isExpanded ? null : row.id) : undefined}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-0.5 shrink-0"
                style={{ backgroundColor: row.color }}
              />

              <span
                className={`font-mono font-semibold text-sm w-5 text-center shrink-0 ${
                  rank === 1 ? "text-racee-accent" : "text-muted-foreground"
                }`}
              >
                {rank}
              </span>

              <div className="flex-1 min-w-0">
                <p className="font-heading text-lg font-bold leading-tight truncate text-foreground">
                  {row.label}
                </p>
                {row.teamName && row.teamName !== row.label && (
                  <p className="font-mono text-[11px] text-muted-foreground leading-none mt-0.5 truncate">
                    {row.teamName}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="font-mono font-bold text-base tabular-nums tracking-[-0.02em] text-foreground">
                  {row.total.toLocaleString()}
                </p>
                <p className="font-mono text-[11px] tabular-nums text-muted-foreground leading-none mt-0.5">
                  {gap === 0 ? "—" : `-${gap.toLocaleString()}`}
                </p>
              </div>

              {isExpandable && (
                <ChevronDown
                  className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              )}
            </div>
          );

          return (
            <div key={row.id} className="last:border-b-0">
              {row.linkTo ? (
                <Link href={row.linkTo} className="block hover:bg-subtle transition-colors">
                  {rowEl}
                </Link>
              ) : (
                <div className="hover:bg-subtle transition-colors">{rowEl}</div>
              )}

              {members && (
                <div className="border-b border-border bg-subtle">
                  {members.map((member, mIdx) => {
                    const share = row.total > 0 ? member.total / row.total : 0;
                    const isLast = mIdx === members.length - 1;
                    return (
                      <div
                        key={mIdx}
                        className={`relative flex items-center gap-3 px-4 py-2.5 min-h-[44px] ${
                          !isLast ? "border-b border-border" : ""
                        }`}
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 w-0.5 opacity-30"
                          style={{ backgroundColor: row.color }}
                        />
                        <div className="w-5 shrink-0" />

                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm text-foreground truncate">{member.name}</p>
                          <div className="mt-1 h-1 w-full rounded-full bg-border overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${share * 100}%`, backgroundColor: row.color }}
                            />
                          </div>
                        </div>

                        <p className="font-mono text-sm tabular-nums text-muted-foreground shrink-0">
                          {member.total.toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
