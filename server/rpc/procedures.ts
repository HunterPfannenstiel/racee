import { os, ORPCError } from "@orpc/server";
import { getSession } from "@/server/auth/server";
import { NotFoundError, AuthorizationError, InvariantViolationError } from "@/server/domain/errors";

/**
 * Maps thrown domain errors to the corresponding ORPCError so individual
 * procedures never have to hand-write this translation. See
 * server/rpc/AGENTS.md's "Error mapping" section for the rules governing
 * when a procedure is allowed to add its own try/catch on top of this.
 */
const withDomainErrors = os.use(async ({ next }) => {
  try {
    return await next();
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw new ORPCError("NOT_FOUND", { message: err.message });
    }
    if (err instanceof AuthorizationError) {
      throw new ORPCError("FORBIDDEN", { message: err.message });
    }
    if (err instanceof InvariantViolationError) {
      throw new ORPCError("UNPROCESSABLE_CONTENT", { message: err.message });
    }
    throw err;
  }
});

/**
 * Every procedure in every router is built off this. Resolves the session
 * once (via the same `getSession()` used across the app's route handlers)
 * and passes it down through context, keeping individual handlers free of
 * repeated auth checks.
 */
export const authed = withDomainErrors.use(async ({ context, next }) => {
  const session = await getSession();
  if (!session) {
    throw new ORPCError("UNAUTHORIZED", { message: "You must be signed in." });
  }
  return next({ context: { ...context, session } });
});

/** Authenticated + the session user must be a site admin (mirrors requireAdmin()). */
export const adminOnly = authed.use(async ({ context, next }) => {
  if (!context.session.user.isAdmin) {
    throw new ORPCError("FORBIDDEN", { message: "Admin access required." });
  }
  return next();
});
