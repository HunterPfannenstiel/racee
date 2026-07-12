# RPC

This directory houses the oRPC routers that expose the backend to the frontend.

## Standards
* One router per domain, composed into the root router in server/rpc/router.ts
* All procedure input/output must be defined with zod schemas
* A procedure must never call a repository or service directly — it must call a query or command
* Every procedure is built off the `authed` middleware base — session authentication is never checked by hand

### Query Procedures
* Must execute a query defined in server/queries for its response
* Must never mutate state

### Command Procedures
* Must execute a command defined in server/commands for its business logic
