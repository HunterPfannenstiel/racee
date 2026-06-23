"use client";

import { useTeammateSelector } from "./hooks/useTeammateSelector";
import { TeammateSelector } from "./TeammateSelector";
import { SubmissionAttribution } from "./SubmissionAttribution";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckIcon } from "lucide-react";

const MOCK_TEAMMATES = [
  { id: "t1", name: "Kolby" },
  { id: "t2", name: "Tommy" },
  { id: "t3", name: "Jake" },
];

const MOCK_TEAM_COLOR = "#e11d48";

const MOCK_SUBMITTED_BY: Record<string, string> = {
  t2: "Hunter",
};

const MOCK_SUBMITTED_AT: Record<string, string> = {
  t2: "2026-06-22T11:30:00Z",
};

function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function TeammateLineup() {
  const { displayName, isProxy, selectedPlayerId, next, prev } =
    useTeammateSelector(MOCK_TEAMMATES);

  const currentSubmittedBy = selectedPlayerId
    ? MOCK_SUBMITTED_BY[selectedPlayerId]
    : undefined;
  const currentSubmittedAt = selectedPlayerId
    ? MOCK_SUBMITTED_AT[selectedPlayerId]
    : undefined;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-3 flex-1">
        <TeammateSelector
          displayName={displayName}
          isProxy={isProxy}
          teamColor={MOCK_TEAM_COLOR}
          onNext={next}
          onPrev={prev}
        />

        <Separator />

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-xs font-mono uppercase tracking-[0.08em] text-muted-foreground">
              June 29, 2026
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Austrian Grand Prix
            </h2>
          </div>

          {currentSubmittedAt ? (
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <span className="flex items-center gap-1.5 text-xs font-medium text-state-success bg-subtle border border-border rounded-sm px-2 py-1">
                <CheckIcon className="size-3" />
                Submitted
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatTimestamp(currentSubmittedAt)}
              </span>
              {currentSubmittedBy && (
                <SubmissionAttribution submittedByName={currentSubmittedBy} teamColor={MOCK_TEAM_COLOR} />
              )}
            </div>
          ) : (
            <span className="text-xs font-medium text-muted-foreground bg-muted rounded-sm px-2 py-1 shrink-0">
              No prediction yet
            </span>
          )}
        </div>

        <Separator />

        <div className="space-y-1">
          {["VER", "NOR", "LEC", "PIA", "SAI", "HAM", "RUS", "ALO"].map(
            (code, i) => (
              <div
                key={code}
                className="flex items-center gap-3 h-11 px-3 rounded-sm bg-subtle"
              >
                <span className="text-xs font-mono text-muted-foreground w-5 text-right">
                  {i + 1}
                </span>
                <span className="text-sm font-mono font-semibold">{code}</span>
              </div>
            )
          )}
        </div>
      </div>

      <div className="p-4 pt-0">
        <Button
          className="w-full h-12 uppercase tracking-[0.06em] font-semibold"
          variant={isProxy ? "outline" : "default"}
          style={
            isProxy && MOCK_TEAM_COLOR
              ? {
                  borderColor: MOCK_TEAM_COLOR,
                  color: MOCK_TEAM_COLOR,
                }
              : undefined
          }
        >
          {isProxy ? `Submit for ${displayName}` : "Submit Predictions"}
        </Button>
      </div>
    </div>
  );
}
