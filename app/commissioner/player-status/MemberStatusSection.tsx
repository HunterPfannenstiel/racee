"use client";

import { CheckCircle2Icon } from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { MembersList } from "./MembersList";
import type { MemberSubmission } from "./types";

type MemberStatusSectionProps = {
  countLabel: string;
  members: MemberSubmission[];
  emptyState?: {
    title: string;
  };
};

export function MemberStatusSection({ countLabel, members, emptyState }: MemberStatusSectionProps) {
  if (members.length === 0 && emptyState) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CheckCircle2Icon />
          </EmptyMedia>
          <EmptyTitle>{emptyState.title}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-2">
      <p className="px-1 text-xs text-muted-foreground">{countLabel}</p>
      <MembersList members={members} />
    </div>
  );
}
