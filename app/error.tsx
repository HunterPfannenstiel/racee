"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="w-full px-4 py-10 space-y-4">
      <div className="border-l-4 border-destructive pl-4">
        <h1 className="font-heading text-[1.75rem] font-bold text-foreground">
          Something went wrong
        </h1>
      </div>
      <p className="text-sm text-muted-foreground">
        An unexpected error occurred. You can try again, or head back to the
        home page.
      </p>
      <Button variant="outline" onClick={() => unstable_retry()}>
        Try again
      </Button>
    </main>
  );
}
