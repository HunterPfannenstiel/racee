"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LeaguePlayerAvatar } from "@/components/avatar/LeaguePlayerAvatar";

type TeammateSelectorProps = {
  /** Whose lineup is shown — drives the avatar. Omit to hide it. */
  userId?: string | null;
  displayName: string;
  isProxy: boolean;
  teamColor?: string;
  onNext: () => void;
  onPrev: () => void;
};

export function TeammateSelector({
  userId,
  displayName,
  isProxy,
  teamColor,
  onNext,
  onPrev,
}: TeammateSelectorProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        size="icon"
        className="size-11 text-muted-foreground"
        onClick={onPrev}
      >
        <ChevronLeft className="size-5" />
      </Button>

      <span className="flex min-w-0 items-center gap-2">
      {userId && <LeaguePlayerAvatar userId={userId} name={displayName} size="sm" />}
      <span
        className="font-mono text-sm font-semibold"
        style={
          isProxy && teamColor
            ? {
                textDecoration: "underline",
                textDecorationColor: teamColor,
                textUnderlineOffset: "4px",
                textDecorationThickness: "2px",
              }
            : undefined
        }
      >
        {displayName}
      </span>
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="size-11 text-muted-foreground"
        onClick={onNext}
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
}
