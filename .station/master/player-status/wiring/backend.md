Here are the full backend details for the player-status feature.

## Endpoint 1 — Race list (reused, not new)

```
GET /api/races?leagueId={leagueId}
```

No auth guard beyond standard session. Returns the full race objects for the league's motorsport, sorted as-stored (not guaranteed pre-sorted by date — sort client-side if needed).  
 Relevant fields per race:

```ts
{
  id: string;
  title: string;
  date: string;
  lockTime?: string;   // ISO datetime, may be absent
  // plus other fields (motorsportId, label, startingGrid, keyOrder, propKey, keySetAt) you can ignore
}
```

Pick your default ("next upcoming") client-side from this list, then use its `id` as `raceId` below.

## Endpoint 2 — Per-race lock + member status (new)

```
GET /api/commissioner/leagues/{leagueId}/player-status?raceId={raceId}
```

- **Auth**: commissioner-only (`requireCommissioner`). Returns `401 { error }` if not signed in or not commissioner/co-commissioner of the league.
- **`raceId` is required.** Returns `400 { error: "Missing raceId" }` if omitted.
- Returns `404 { error }` if the league or race isn't found.  


Response body:

```ts
{
  race: {
    id: string;
    locked: boolean; // now >= race.lockTime
    lockTime: string | null; // ISO datetime, or null if the race has no lockTime set
  }
  members: {
    id: string;
    name: string;
    submittedAt: string | null; // ISO datetime if submitted, else null
  }
  [];
}
```

Notes:

- `members` includes **every** league member (excluding the commissioner themself), regardless of submission status — not just ones who submitted.
- There is **no stored "submitted/pending/missed" status** — only `submitted` (implied by `submittedAt !== null`) and `race.locked`. Derive the three-way status client-side:  
  `submittedAt ? "submitted" : (race.locked ? "missed" : "pending")`. This was a hard requirement from the frontend spec — don't expect the backend to ever add a stored status enum  
  here.
- Re-fetch this endpoint whenever the race selector changes; it's scoped to one race per call (the race list above doesn't change per-selection, so it's fetched separately/once).  


That's the whole surface — two GETs, no mutations, matching `useMockPlayerStatus`'s shape
