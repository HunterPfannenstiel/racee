"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { MemberList } from "./MemberList";
import { MemberActionContent } from "./MemberActionContent";
import type { Member } from "./hooks/useCoCommissioner";

type CoCommissionerProps = {
  members: Member[];
  coCommissioners: Member[];
  onPromote: (id: string) => void;
  onDemote: (id: string) => void;
};

export function CoCommissioner({
  members,
  coCommissioners,
  onPromote,
  onDemote,
}: CoCommissionerProps) {
  const [selected, setSelected] = useState<{
    member: Member;
    action: "promote" | "demote";
  } | null>(null);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Role Management
        </h2>
      </CardHeader>
      <CardContent className="p-0">
        <MemberList
          title="Co-Commissioners"
          members={coCommissioners}
          onSelect={(member) => setSelected({ member, action: "demote" })}
          emptyText="No co-commissioners"
        />
        <MemberList
          title="Members"
          members={members}
          onSelect={(member) => setSelected({ member, action: "promote" })}
          emptyText="No members"
        />
        {selected && (
          <div className="px-4 py-3 border-t border-border">
            <MemberActionContent
              name={selected.member.name}
              action={selected.action}
              onAction={() => {
                if (selected.action === "promote") {
                  onPromote(selected.member.id);
                } else {
                  onDemote(selected.member.id);
                }
                setSelected(null);
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
