"use client";

import { CheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SubmissionStatus } from "./types";

type MemberStatusIndicatorProps = {
  status: SubmissionStatus;
  submittedAt: string | null;
};

function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function MemberStatusIndicator({ status, submittedAt }: MemberStatusIndicatorProps) {
  if (status === "missed") {
    return <Badge className="bg-destructive text-white">Missed</Badge>;
  }

  if (status === "pending") {
    return <Badge variant="outline">Pending</Badge>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-muted-foreground">
          <CheckIcon className="size-4" />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {submittedAt ? `Submitted ${formatTimestamp(submittedAt)}` : "Submitted"}
      </TooltipContent>
    </Tooltip>
  );
}
