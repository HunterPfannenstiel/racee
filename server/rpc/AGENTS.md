# RPC

This directory houses the oRPC routers that expose the backend to the frontend.

## Standards
* One router per domain, composed into the root router in server/rpc/router.ts
* All procedure input/output must be defined with zod schemas
* A procedure must never call a repository or service directly — it must call a query or command
* `authed`, `adminOnly`, and `publicProcedure` are defined exactly once, in server/rpc/procedures.ts, and imported by every router — never re-derived locally
* Every procedure is built off `authed`, `adminOnly`, or `publicProcedure` — session authentication is never checked by hand
* `publicProcedure` is the deliberate exception to "authed by default": use it only when the underlying query performs no gating of its own (no membership check, no ownership check) and the data is meant to be openly shareable regardless of who's asking — e.g. a shareable read-only comparison view. Everything else defaults to `authed`

### Error mapping
* `authed`'s middleware chain automatically maps thrown domain errors to ORPCError — NotFoundError → NOT_FOUND, AuthorizationError → FORBIDDEN. A procedure never hand-writes this translation; throwing the domain error from the query/command is enough
* A procedure only adds its own try/catch to override the mapped message for a deliberate UX reason (e.g. hiding *why* an invite token failed) — never to perform the generic mapping itself
* A query or command that can fail to find its subject always throws NotFoundError itself — it never returns null and pushes the existence check onto the procedure

### Query Procedures
* Must execute a query defined in server/queries for its response
* Must never mutate state

### Command Procedures
* Must execute a command defined in server/commands for its business logic
