# Services

* A service holds domain logic reused by more than one query or command
* If only one query or command needs a piece of logic, it belongs in that query or command — not in a service
* A service operates on entities already loaded by the query or command that calls it — a service never calls a repository
* A service is only ever called by a query or command, never by an rpc procedure directly
