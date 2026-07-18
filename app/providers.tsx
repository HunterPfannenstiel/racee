"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function Providers({ children }: { children: React.ReactNode }) {
  // useState (not a module-level singleton) so each request/session on the
  // server gets its own client, while still being stable across re-renders
  // on the client.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data doesn't need to be refetched the instant it's touched
            // again - 30s keeps repeated navigations cheap without going
            // stale for long.
            staleTime: 30_000,
            // A single retry is enough to smooth over a flaky request
            // without masking a real failure behind a long retry chain.
            retry: 1,
            // Refetching every time the window regains focus is noisy for
            // this app's data (profile/league info doesn't change that
            // often); opt out and rely on staleTime + explicit invalidation.
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV !== "production" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
