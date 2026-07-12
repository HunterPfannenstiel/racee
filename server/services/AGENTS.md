# Services

* A service is a module of plain exported functions — not a class — under server/services/<name>.ts
* A service function takes entities (and primitives) as arguments and returns a value, or mutates the entities it was given by calling their own methods — it never constructs, loads, or persists anything itself
* A service never imports a repository, Prisma, or blob storage — same zero-I/O rule as an entity, one level up
* A service holds domain logic that spans more than one entity and is reused by more than one command or query. If only one command or query needs it, the logic belongs inline in that command or query, not in a service
* No interface is defined for a service — there's nothing to swap. A pure function has exactly one implementation, so there's no I<Name>Service to keep in sync
* A command or query loads entities (via repositories) before calling a service function, and persists any resulting mutations afterward — a service never holds open the "unit of work"
