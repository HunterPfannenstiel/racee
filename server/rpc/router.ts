import { meRouter } from "@/server/rpc/routers/me";
import { leaguesRouter } from "@/server/rpc/routers/leagues";

/**
 * Root oRPC router. Compose additional domain sub-routers here as they're
 * added.
 */
export const router = {
  me: meRouter,
  leagues: leaguesRouter,
};

export type AppRouter = typeof router;
