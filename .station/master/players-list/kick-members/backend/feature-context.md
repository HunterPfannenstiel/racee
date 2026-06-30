Here's what's relevant for the backend work on the kick/remove member feature:

**Frontend call site** — `app/commissioner/players-list/hooks/usePlayersList.ts`, in the `kick(id)` function:

```ts
async function kick(id: string) {
  addActionPending(id);
  try {
    const r = await fetch(
      `/api/commissioner/leagues/${leagueId}/players/${id}/kick`,
      { method: "POST" },
    );
    if (!r.ok) return;
    setMembers((prev) => prev.filter((m) => m.id !== id));
  } finally {
    removeActionPending(id);
  }
}
```

**Route I used**: `POST /api/commissioner/leagues/{leagueId}/players/{id}/kick` — chosen to mirror the existing `accept`/`deny` routes already in that file (`.../players/{id}/accept`,
`.../players/{id}/deny`), which presumably already have backend handlers you can use as a reference for auth/commissioner-check patterns. **This route is not law** — I made it up to  
 match the existing convention. If you want a different shape, tell me and I'll update the fetch call to match.

**Contract the frontend expects**:

- POST, no body needed (no reason field, no notify toggle — those are explicitly out of scope per the spec).
- Success = any `r.ok` (2xx) response; frontend doesn't read the response body, it just removes the member from local state on success.
- Failure = non-2xx; frontend currently does nothing visible on failure (no error toast/message yet) — silently leaves the member in the list. If you want a specific error shape for  
  the frontend to surface, let me know and I'll add error handling.  


**Behavior contract from the product spec** (`/Users/hunterpfannenstiel/projects/racee/my-app/.station/master/players-list/kick-members/presentation/context.md`), relevant to what the
backend needs to enforce:

- Forward-only — kicked member loses access immediately (can't view league, can't predict), but their historical data/predictions stay untouched (no cascade delete).
- No "kicked" status — they should be treated identically to someone who was never a member. If they reuse the invite link, they land back in Pending (not blocked).
- No notification sent to the removed player.  


**Types involved** (from `usePlayersList.ts`): `Member = { id: string; name: string; role: "co-commissioner" | "member" }`. The id field is whatever member/user identifier you're  
 keying league membership by — I didn't add any new client-side ID concept.

That's the full surface — nothing else in the frontend implementation should constrain your backend design choices.
