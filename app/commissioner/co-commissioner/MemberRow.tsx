"use client";

import { LeaguePlayerAvatar } from "@/components/avatar/LeaguePlayerAvatar";

type MemberRowProps = {
  userId: string;
  name: string;
  onClick?: () => void;
};

export function MemberRow({ userId, name, onClick }: MemberRowProps) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 text-left px-4 py-3 text-sm transition-colors hover:bg-muted/50 text-foreground"
      onClick={onClick}
    >
      <LeaguePlayerAvatar userId={userId} name={name} size="md" />
      <span className="truncate">{name}</span>
    </button>
  );
}
