"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { cn } from "@/lib/utils";
import { PLAYER_COLOR_PALETTE } from "@/lib/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLeagueAvatars } from "@/components/avatar/useLeagueAvatars";
import type { Member } from "./types";

type Props = {
  leagueId: string;
  member: Member;
  currentColor?: string;
  /** True when the player is on a team, so their ring shows the team color instead. */
  onTeamColor: boolean;
  onClose: () => void;
};

/** Commissioner picks a player's ring color for this league. */
export function PlayerColorDialog({ leagueId, member, currentColor, onTeamColor, onClose }: Props) {
  const queryClient = useQueryClient();
  const [color, setColor] = useState((currentColor ?? PLAYER_COLOR_PALETTE[0]).toLowerCase());
  const { byUserId } = useLeagueAvatars(leagueId);
  // Colors other players already use, so the commissioner can see what's taken.
  const taken = new Set(
    Object.values(byUserId)
      .filter((a) => a.userId !== member.id)
      .map((a) => a.color.toLowerCase()),
  );

  const mutation = useMutation(
    orpc.leagues.players.setColor.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.leagues.avatars.list.key({ input: { leagueId } }) });
        onClose();
      },
    }),
  );

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{member.name}&apos;s color</DialogTitle>
        </DialogHeader>
        {onTeamColor && (
          <p className="text-xs text-muted-foreground">
            They&apos;re on a team, so their ring shows the team color. This color is used if they leave the team.
          </p>
        )}
        <div className="grid grid-cols-6 gap-2">
          {PLAYER_COLOR_PALETTE.map((c) => {
            const selected = color === c.toLowerCase();
            const isTaken = taken.has(c.toLowerCase());
            return (
              <button
                key={c}
                type="button"
                aria-label={`${c}${isTaken ? " (in use)" : ""}`}
                aria-pressed={selected}
                title={isTaken ? "Already used by another player or team" : undefined}
                onClick={() => setColor(c.toLowerCase())}
                className={cn(
                  "relative aspect-square rounded-full flex items-center justify-center",
                  selected && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                  isTaken && !selected && "opacity-35",
                )}
                style={{ backgroundColor: c }}
              >
                {selected && <Check className="size-4 text-white drop-shadow" />}
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Custom
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value.toLowerCase())}
            className="h-8 w-12 cursor-pointer rounded border border-input bg-transparent"
          />
        </label>
        {mutation.isError && <p className="text-xs text-destructive">Couldn&apos;t save the color. Try again.</p>}
        <DialogFooter>
          <Button onClick={() => mutation.mutate({ leagueId, userId: member.id, color })} disabled={mutation.isPending}>
            {mutation.isPending && <Spinner className="w-3 h-3 mr-1" />}
            Save
          </Button>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
