# Roles

* All methods should be defined on the /Roles.ts static class
* All data required will be retrieved using the relevant repositories (server/repositories)
* Session authentication (is there a user, is the user an admin) is the rpc `authed` middleware's job, never Roles'
* Roles is for resource-scoped checks that require a loaded record — e.g. "is this user the commissioner of this league"
* A query or command calls Roles explicitly, once it has loaded the resource in question
