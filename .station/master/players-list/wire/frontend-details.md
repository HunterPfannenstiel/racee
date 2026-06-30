Here are the spots that need wiring, based on what was just built:

**`app/commissioner/players-list/hooks/useMockPlayersList.ts`**  
 This entire file is the seam. It currently holds local `useState` with hardcoded `MOCK_PENDING`/`MOCK_MEMBERS` arrays and synchronous `accept(id)`/`deny(id)` functions. To wire it up  
 you'd replace this with a real data-fetching hook (or split into a `useMockPlayersList` + `usePlayersList` pair, following the `ConnectedCoCommissioner`/`co-commissioner.tsx` split  
 pattern already in this codebase) that:

- Fetches pending + member lists for a `leagueId` (the hook currently takes no params)
- Makes `accept`/`deny` actually call the backend and update state from the response (likely with optimistic updates + rollback, like `handleAssign` does in the teams page)  


**`app/commissioner/players-list/index.tsx`**  
 Currently calls `useMockPlayersList()` with no arguments. It'll need a `leagueId` prop threaded in (or pulled from context) to pass to the real hook, plus probably `loading`/`error`  
 state handling — none of that exists right now since this was mock-only.

**`app/commissioner/leagues/[leagueId]/players/page.tsx`**  
 Already has `leagueId` from `useParams`, but doesn't pass it to `<PlayersList />` yet — that prop wire-up is needed once `index.tsx` accepts it.

**Type shapes**: `PendingPlayer` and `Member` (defined in the hook file) are just `{ id, name }`. Whatever the real API returns will need to map onto (or replace) these — check field  
 names match before assuming compatibility.

That's it — no other files in the feature (`PendingRow`, `PendingSection`, `MemberRow`, `MembersSection`) need changes, since they're pure presentational components driven entirely by
props.
