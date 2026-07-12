"use client";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

/** Standard loading row for a pending TanStack query. */
export function QueryLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Spinner />
      {label}
    </div>
  );
}

/** Standard error state for a failed TanStack query, with an optional retry. */
export function QueryError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const message =
    error instanceof Error ? error.message : "Something went wrong. Try again.";
  return (
    <div className="space-y-2">
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
