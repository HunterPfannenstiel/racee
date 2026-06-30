"use client";

import { MemberRow } from "./MemberRow";
import type { Member } from "./hooks/usePlayersList";

type MembersSectionProps = {
  members: Member[];
  onRemove: (id: string) => void;
  actionPending: Set<string>;
};

export function MembersSection({ members, onRemove, actionPending }: MembersSectionProps) {
  if (members.length === 0) {
    return <p className="px-4 pb-3 text-sm text-muted-foreground">No members yet.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {members.map((member) => (
        <MemberRow
          key={member.id}
          member={member}
          onRemove={() => onRemove(member.id)}
          isRemovePending={actionPending.has(member.id)}
        />
      ))}
    </div>
  );
}
