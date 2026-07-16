"use client";

import { useEffect, useMemo, useState } from "react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { JumpablePlayer } from "./types";

function PlayerRow({
  player,
  onSelect,
}: {
  player: JumpablePlayer;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!player.hasSubmitted}
      onClick={onSelect}
      className={cn(
        "flex min-h-[52px] w-full items-center gap-3 border-b border-border px-4 py-3 text-left last:border-b-0",
        player.hasSubmitted ? "transition-colors hover:bg-subtle" : "opacity-50"
      )}
    >
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: player.color }} />
      <span className="min-w-0 flex-1 truncate font-heading text-sm font-bold text-foreground">{player.name}</span>
      {player.hasSubmitted ? (
        <span className="shrink-0 font-mono text-xs text-muted-foreground">#{player.rank}</span>
      ) : (
        <span className="shrink-0 text-xs text-muted-foreground">Didn&apos;t submit</span>
      )}
    </button>
  );
}

type PlayerJumpDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  players: JumpablePlayer[];
  onSelect: (userId: string) => void;
};

export function PlayerJumpDrawer({ open, onOpenChange, players, onSelect }: PlayerJumpDrawerProps) {
  const [query, setQuery] = useState("");

  // Reset the search once the drawer closes so it doesn't carry over the
  // next time it's opened (e.g. jumping to the same or a different side).
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const sorted = useMemo(() => {
    return [...players].sort((a, b) => {
      if (a.hasSubmitted !== b.hasSubmitted) return a.hasSubmitted ? -1 : 1;
      if (a.hasSubmitted && b.hasSubmitted) return (a.rank ?? 0) - (b.rank ?? 0);
      return a.name.localeCompare(b.name);
    });
  }, [players]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((p) => p.name.toLowerCase().includes(q));
  }, [sorted, query]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:h-[70vh]">
        <DrawerTitle className="sr-only">Jump to player</DrawerTitle>
        <div className="px-4 pt-1 pb-3">
          <Input placeholder="Search players..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.map((player) => (
            <PlayerRow key={player.userId} player={player} onSelect={() => onSelect(player.userId)} />
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
