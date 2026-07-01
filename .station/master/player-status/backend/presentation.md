Here's the data contract the presentational layer expects, derived from `useMockPlayerStatus` (`app/commissioner/player-status/hooks/useMockPlayerStatus.ts`):

## Scope

Per-league, per-race. Commissioner-only. Read-only (no mutations — no submit/edit actions from this page).

## Data needed

**1. Races for a league** — list of `{ id, title, date }`. Frontend needs to know which race is selected (defaults to "next upcoming" — that logic currently lives client-side  
 comparing `date` to today, but you may want to just return them sorted and let it pick, or tell us if lock/date semantics differ from `lib/schemas.ts`'s existing `Race`).

**2. Per selected race, a lock/deadline state:**

- `locked: boolean` — has the submission window closed for this race. This is the one hard dependency: **is there an actual queryable lock timestamp per race, or just a boolean?** The
  existing `Race` schema (`lib/schemas.ts`) already has an optional `lockTime: string (datetime)` field — if that's the real source of truth, great, but confirm it's  
  populated/queryable per race, not just optional/sometimes-null in practice.
- `lockTime: string | null` (ISO datetime) — used to show "closes at X" when open. **Must tolerate being null/absent** — the UI has an explicit fallback for "no timestamp available"  
  so don't feel you need to backfill it everywhere.  


**3. Per league member, per selected race, submission status** — for every league member (not just ones with submissions), need:

- `id`, `name` (member identity)
- whether they've submitted their lineup/prediction for that race (boolean or derived)
- if submitted: `submittedAt` (ISO datetime) — shown in a tooltip  


**Important derivation rule (hard requirement, not negotiable on the backend either):** "Pending" vs "Missed" is not a per-member stored status — it's `submitted ? "submitted" :       
  (raceLocked ? "missed" : "pending")`. So you don't need to store/compute a three-way status per member; just give us **submitted (bool + timestamp)** per member and **locked (bool)**  
 per race, and the frontend derives the rest. Don't design an API that requires a stored "pending/missed" enum per member — it'd be redundant and could drift from the race-level lock  
 state.

## Not needed from backend (out of scope per the UI/UX spec)

- Lineup/prediction _content_ — status only, no review/approval.
- Cross-race/historical aggregation ("who misses often").
- Visibility to non-commissioners.
- Any scoreboard-facing checkmark data.  


## Shape summary (illustrative, not prescriptive)

```
GET .../leagues/{leagueId}/player-status?raceId=...
{
  races: { id, title, date }[],
  race: { id, locked, lockTime: string | null },
  members: { id, name, submittedAt: string | null }[]
}
```

That's everything the frontend consumes — happy to answer follow-ups on exact field names if you want to match what's already in `hooks/useMockPlayerStatus.ts` exactly.
