"use client";

import { MemberRow } from "./MemberRow";
import type { Member } from "./hooks/useCoCommissioner";

type MemberListProps = {
  title: string;
  members: Member[];
  onSelect: (member: Member) => void;
  emptyText: string;
};

export function MemberList({
  title,
  members,
  onSelect,
  emptyText,
}: MemberListProps) {
  return (
    <div>
      <div className="px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
      </div>
      {members.length === 0 ? (
        <p className="px-4 pb-3 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="divide-y divide-border">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              name={member.name}
              onClick={() => onSelect(member)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
