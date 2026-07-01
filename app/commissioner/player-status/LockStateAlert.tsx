"use client";

import { InfoIcon, LockIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type LockStateAlertProps = {
  locked: boolean;
  lockTime: string | null;
};

function formatLockTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function LockStateAlert({ locked, lockTime }: LockStateAlertProps) {
  if (locked) {
    return (
      <Alert variant="destructive">
        <LockIcon />
        <AlertDescription>Submissions closed.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <InfoIcon />
      <AlertDescription>
        {lockTime ? `Submissions open — closes ${formatLockTime(lockTime)}.` : "Submissions open."}
      </AlertDescription>
    </Alert>
  );
}
