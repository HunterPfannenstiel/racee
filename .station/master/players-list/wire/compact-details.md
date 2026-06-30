Here's what needs to change when you wire this up to real data, based on what's already built:

**`app/commissioner/players-list/hooks/useMockPlayersList.ts`** — this is the swap point. Right now it's local `useState` seeded with `MOCK_PENDING`/`MOCK_MEMBERS` arrays, and  
 `accept`/`deny` just mutate that local state synchronously. Replace this whole hook with a real data hook that:

- Fetches pending/members scoped to a league (it currently takes no `leagueId` param at all — not threaded in anywhere)
- Makes `accept(id)` and `deny(id)` call real endpoints instead of just filtering arrays
- Has no loading/error state modeled — components currently assume `pending`/`members` are always valid populated arrays from the first render  


**`app/commissioner/players-list/index.tsx`** — calls `useMockPlayersList()` with no arguments. Needs to accept/pass `leagueId` once the real hook needs it to scope its query. Also  
 has no loading or error UI — you'll want to add that here before rendering the two `Card` sections.

**`app/commissioner/leagues/[leagueId]/players/page.tsx`** — already pulls `leagueId` from `useParams`, but never passes it to `<PlayersList />`. That prop wiring needs to be added.

**`PendingRow.tsx`** — `onAccept`/`onDeny` are called synchronously with no in-flight/disabled state. Once these trigger real mutations, you'll likely want per-row pending state (e.g.
disable buttons while the request is in flight) and a way to surface failure.

**Types (`PendingPlayer`, `Member`)** — currently just `{ id: string; name: string }`. Real records will probably carry more fields; adding them is additive, but  
 `PendingRow`/`MemberRow` only render `.name` today, so any new fields you want displayed need to be added there explicitly.

**Empty-state vs. loading-state** — `PendingSection`/`MembersSection` show "No pending requests."/"No members yet." when arrays are empty. Without a loading flag, the first paint  
 before your fetch resolves will show those empty messages rather than a loading indicator — worth deciding if that's acceptable or needs a skeleton/spinner
