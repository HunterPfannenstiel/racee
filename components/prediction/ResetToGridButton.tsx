"use client";

import { useEffect, useState } from "react";
import { RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ResetToGridButtonProps = {
  orderedRacerIds: string[];
  startingGrid: string[];
  onReset: (racerIds: string[]) => void;
  disabled?: boolean;
};

// How long the armed "tap again to confirm" state stays live before
// auto-reverting to the resting state without performing the reset.
const ARM_TIMEOUT_MS = 3500;

function matchesGridOrder(orderedRacerIds: string[], startingGrid: string[]): boolean {
  return (
    orderedRacerIds.length === startingGrid.length &&
    orderedRacerIds.every((id, i) => id === startingGrid[i])
  );
}

export function ResetToGridButton({
  orderedRacerIds,
  startingGrid,
  onReset,
  disabled,
}: ResetToGridButtonProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), ARM_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [armed]);

  function handleClick() {
    if (armed) {
      onReset(startingGrid);
      setArmed(false);
      return;
    }
    if (matchesGridOrder(orderedRacerIds, startingGrid)) return;
    setArmed(true);
  }

  return (
    <Button
      type="button"
      variant={armed ? "destructive" : "ghost"}
      size="sm"
      disabled={disabled}
      onClick={handleClick}
    >
      <RotateCcwIcon data-icon="inline-start" />
      {armed ? "Tap again to confirm" : "Reset Grid"}
    </Button>
  );
}
