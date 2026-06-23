"use client";

import { Button } from "@/components/ui/button";

type MemberActionContentProps = {
  name: string;
  action: "promote" | "demote";
  onAction: () => void;
};

export function MemberActionContent({ name, action, onAction }: MemberActionContentProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {action === "promote"
          ? `${name} will gain full league management access.`
          : `${name} will lose league management access.`}
      </p>
      <Button
        variant={action === "demote" ? "destructive" : "default"}
        className="w-full"
        onClick={onAction}
      >
        {action === "promote" ? "Promote" : "Demote"}
      </Button>
    </div>
  );
}
