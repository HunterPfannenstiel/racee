"use client";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { BatchLinkPlugin } from "@orpc/client/plugins";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { RouterClient } from "@orpc/server";
import type { router } from "@/server/rpc/router";

const link = new RPCLink({
  url: () => `${window.location.origin}/api/rpc`,
  // Coalesces concurrent procedure calls (e.g. a page composing several
  // useQuery reads) into a single HTTP round-trip.
  plugins: [
    new BatchLinkPlugin({
      groups: [{ condition: () => true, context: {} }],
    }),
  ],
});

const client: RouterClient<typeof router> = createORPCClient(link);

/**
 * Typed oRPC client wrapped with TanStack Query utilities. Import this
 * everywhere client components need to call the backend, e.g.
 * `useQuery(orpc.me.get.queryOptions())`.
 */
export const orpc = createTanstackQueryUtils(client);
