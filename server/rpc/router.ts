import { meRouter } from "@/server/rpc/routers/me";
import { leaguesRouter } from "@/server/rpc/routers/leagues";
import { motorsportsRouter } from "@/server/rpc/routers/motorsports";
import { racersRouter } from "@/server/rpc/routers/racers";
import { racesRouter } from "@/server/rpc/routers/races";
import { usersRouter } from "@/server/rpc/routers/users";
import { predictionsRouter } from "@/server/rpc/routers/predictions";
import { playersRouter } from "@/server/rpc/routers/players";
import { standingsRouter } from "@/server/rpc/routers/standings";

/**
 * Root oRPC router. Compose additional domain sub-routers here as they're
 * added.
 */
export const router = {
  me: meRouter,
  leagues: leaguesRouter,
  motorsports: motorsportsRouter,
  racers: racersRouter,
  races: racesRouter,
  users: usersRouter,
  predictions: predictionsRouter,
  players: playersRouter,
  standings: standingsRouter,
};

export type AppRouter = typeof router;
