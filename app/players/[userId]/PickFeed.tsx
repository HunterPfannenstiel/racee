"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { RacePickEntryDTO } from "@/server/queries/user-profile-stats/IUserProfileStatsQuery";
import type { RacerDTO } from "@/server/queries/user-profile-stats/IUserProfileStatsQuery";
import type { PropName } from "@/lib/schemas";

const PROP_LABELS: Record<PropName, string> = {
  driverOfDay: "Driver of Day",
  lapsLed: "Laps Led",
  fastestPitStop: "Fastest Pit Stop",
  fastestLap: "Fastest Lap",
  overAchiever: "Over Achiever",
  underAchiever: "Under Achiever",
  wrecker: "Wrecker",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface PickFeedProps {
  pickFeed: RacePickEntryDTO[];
  racersById: Record<string, RacerDTO>;
}

export function PickFeed({ pickFeed, racersById }: PickFeedProps) {
  const [expandedRaceId, setExpandedRaceId] = useState<string | null>(null);

  function toggleRace(raceId: string) {
    setExpandedRaceId((prev) => (prev === raceId ? null : raceId));
  }

  return (
    <div>
      <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-3">
        Prediction History
      </p>
      <div className="space-y-2">
        {pickFeed.map((race) => {
          const isExpanded = expandedRaceId === race.raceId;

          return (
            <div
              key={race.raceId}
              className="bg-surface border border-border rounded-lg overflow-hidden"
            >
              {/* Collapsed row */}
              <button
                type="button"
                onClick={() => toggleRace(race.raceId)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-foreground leading-tight truncate">
                    {race.title}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    {formatDate(race.date)}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {race.isGraded ? (
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                        race.propWeightedAccuracy !== null && race.propWeightedAccuracy >= 0.6
                          ? "text-state-success bg-state-success/10"
                          : "text-muted-foreground bg-subtle"
                      }`}
                    >
                      {race.propWeightedAccuracy !== null
                        ? Math.round(race.propWeightedAccuracy * 100) + "%"
                        : "—"}
                    </span>
                  ) : (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md text-muted-foreground bg-subtle">
                      PENDING
                    </span>
                  )}

                  <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                    ×{race.leagueCount}
                  </span>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              </button>

              {/* Expanded picks */}
              {isExpanded && (
                <div className="border-t border-border px-4 py-3 space-y-2">
                  {race.propPicks.map((pick) => {
                    const answerName = racersById[pick.answer]?.name ?? pick.answer;

                    return (
                      <div key={pick.propType} className="flex items-start gap-3">
                        <span className="text-xs font-mono uppercase tracking-wide text-muted-foreground w-32 flex-shrink-0 pt-0.5">
                          {PROP_LABELS[pick.propType]}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-foreground">{answerName}</span>

                            {pick.weight > 1 && (
                              <span className="text-xs text-muted-foreground font-mono">
                                ×{pick.weight}
                              </span>
                            )}

                            {race.isGraded ? (
                              pick.isCorrect ? (
                                <span className="text-state-success text-sm">✓</span>
                              ) : (
                                <span className="text-state-error text-sm">✗</span>
                              )
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </div>

                          {race.isGraded && !pick.isCorrect && pick.correctAnswers[0] && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {racersById[pick.correctAnswers[0]]?.name ?? pick.correctAnswers[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
