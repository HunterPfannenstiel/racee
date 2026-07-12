"use client";

import { Button } from "@/components/ui/button";
import type { PendingPlayer } from "./types";

type PendingRowProps = {
  player: PendingPlayer;
  onAccept: () => void;
  onDeny: () => void;
  isPending: boolean;
};

export function PendingRow({ player, onAccept, onDeny, isPending }: PendingRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm">{player.name}</span>
      <div className="flex gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={onDeny} disabled={isPending}>
          Deny
        </Button>
        <Button size="sm" onClick={onAccept} disabled={isPending}>
          Accept
        </Button>
      </div>
    </div>
  );
}
