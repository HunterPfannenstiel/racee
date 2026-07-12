import { meRouter } from "@/server/rpc/routers/me";

/**
 * Root oRPC router. Compose additional domain sub-routers here as they're
 * added (e.g. `leagues: leaguesRouter`).
 */
export const router = {
  me: meRouter,
};

export type AppRouter = typeof router;
