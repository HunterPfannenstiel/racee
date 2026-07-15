# Pages

## Standards
* You must only use client components
* All network interactions must flow through TanStack Query — no bespoke fetch/loading-state hooks
* Reads: useQuery(orpc.<domain>.<procedure>.queryOptions()) — never a hand-written query key
* Writes: useMutation(orpc.<domain>.<procedure>.mutationOptions()), invalidating the relevant query key(s) on success
