"use client";

import { MemberRow } from "./MemberRow";
import type { MemberSubmission } from "./types";

type MembersListProps = {
  members: MemberSubmission[];
};

export function MembersList({ members }: MembersListProps) {
  return (
    <div className="divide-y divide-border">
      {members.map((member) => (
        <MemberRow key={member.id} member={member} />
      ))}
    </div>
  );
}
