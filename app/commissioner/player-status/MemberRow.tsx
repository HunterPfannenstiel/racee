"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MemberStatusIndicator } from "./MemberStatusIndicator";
import type { MemberSubmission } from "./types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type MemberRowProps = {
  member: MemberSubmission;
};

export function MemberRow({ member }: MemberRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Avatar size="sm">
        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
      </Avatar>
      <span className="text-sm truncate">{member.name}</span>
      <div className="flex-1" />
      <MemberStatusIndicator status={member.status} submittedAt={member.submittedAt} />
    </div>
  );
}
