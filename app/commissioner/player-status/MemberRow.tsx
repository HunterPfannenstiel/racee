"use client";

import { MemberStatusIndicator } from "./MemberStatusIndicator";
import type { MemberSubmission } from "./types";
import { LeaguePlayerAvatar } from "@/components/avatar/LeaguePlayerAvatar";

type MemberRowProps = {
  member: MemberSubmission;
};

export function MemberRow({ member }: MemberRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <LeaguePlayerAvatar userId={member.id} name={member.name} size="md" />
      <span className="text-sm truncate">{member.name}</span>
      <div className="flex-1" />
      <MemberStatusIndicator status={member.status} submittedAt={member.submittedAt} />
    </div>
  );
}
