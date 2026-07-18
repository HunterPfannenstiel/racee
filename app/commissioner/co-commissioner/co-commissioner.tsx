"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { MemberList } from "./MemberList";
import { MemberActionContent } from "./MemberActionContent";
export type Member = {
  id: string;
  name: string;
};

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
    <>
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
        </CardContent>
      </Card>

      <Drawer open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{selected?.member.name}</DrawerTitle>
          </DrawerHeader>
          <DrawerFooter>
            {selected && (
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
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
