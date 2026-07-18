# Server

This directory stores all of the functionality necessary to perform actions on the server. Very minimal server-side code should be written outside of this directory.

## Standards
* Dependencies only point inward: rpc → queries/commands → { repositories, services }. A service never touches a repository — it operates on entities the query or command already loaded. Never skipped, never reversed.

* RPC (/rpc)
    * The only layer allowed to talk to the frontend

* Queries (/queries)
    * Every read a query procedure needs is fulfilled by a query here

* Commands (/commands)
    * Every write a command procedure performs is fulfilled by a command here

* Services (/services)
    * Domain logic shared by more than one query or command

* Repositories (/repositories)
    * The only layer allowed to talk to Prisma or blob storage

* Domain (/domain)
    * Entities — the objects that carry identity, state, and the business rules that protect that state

* Roles (/roles)
    * All resource-scoped authorization is a call to this static class
