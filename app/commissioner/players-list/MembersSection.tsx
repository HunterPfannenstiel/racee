"use client";

import { MemberRow } from "./MemberRow";
import type { Member } from "./hooks/usePlayersList";

type MembersSectionProps = {
  members: Member[];
};

export function MembersSection({ members }: MembersSectionProps) {
  if (members.length === 0) {
    return <p className="px-4 pb-3 text-sm text-muted-foreground">No members yet.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {members.map((member) => (
        <MemberRow key={member.id} member={member} />
      ))}
    </div>
  );
}
