"use client";

import { Badge } from "@/components/ui/badge";
import { getAppEnv } from "@/lib/env";

const ENV_LABELS = {
  local: "Local",
  preview: "Preview",
  integration: "Testing",
} as const;

const ENV_STYLES = {
  local: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400",
  preview: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  integration: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
} as const;

export default function EnvBadge() {
  const env = getAppEnv();

  if (env === "production") return null;

  return (
    <Badge variant="outline" className={ENV_STYLES[env]}>
      {ENV_LABELS[env]}
    </Badge>
  );
}
