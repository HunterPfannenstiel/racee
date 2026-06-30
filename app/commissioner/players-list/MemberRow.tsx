"use client";

import type { Member } from "./hooks/usePlayersList";

type MemberRowProps = {
  member: Member;
};

export function MemberRow({ member }: MemberRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm">{member.name}</span>
    </div>
  );
}
