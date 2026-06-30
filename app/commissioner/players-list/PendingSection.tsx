"use client";

import { PendingRow } from "./PendingRow";
import type { PendingPlayer } from "./hooks/usePlayersList";

type PendingSectionProps = {
  pending: PendingPlayer[];
  onAccept: (id: string) => void;
  onDeny: (id: string) => void;
  actionPending: Set<string>;
};

export function PendingSection({ pending, onAccept, onDeny, actionPending }: PendingSectionProps) {
  if (pending.length === 0) {
    return <p className="px-4 pb-3 text-sm text-muted-foreground">No pending requests.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {pending.map((player) => (
        <PendingRow
          key={player.id}
          player={player}
          onAccept={() => onAccept(player.id)}
          onDeny={() => onDeny(player.id)}
          isPending={actionPending.has(player.id)}
        />
      ))}
    </div>
  );
}
