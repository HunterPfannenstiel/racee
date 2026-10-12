"use client";

import { Button } from "@/components/ui/button";
import type { PendingPlayer } from "./types";
import { PlayerAvatar } from "@/components/avatar/PlayerAvatar";

type PendingRowProps = {
  player: PendingPlayer;
  onAccept: () => void;
  onDeny: () => void;
  isPending: boolean;
};

export function PendingRow({ player, onAccept, onDeny, isPending }: PendingRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="flex min-w-0 items-center gap-2 text-sm">
        <PlayerAvatar userId={player.id} name={player.name} size="md" />
        <span className="truncate">{player.name}</span>
      </span>
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
