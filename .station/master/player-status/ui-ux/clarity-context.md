## Context for the Submission Status Page — UI/UX Workshop

**Purpose:** Give commissioners a way to catch which league members forgot to submit their lineup for a race, before it's too late to matter. This is a "who needs a nudge" tool, not a
general status dashboard.

**Structure (locked, not up for redesign — but layout/visuals are):**

- New standalone page, entry point from the commissioner dashboard.
- Race selector → selecting a race shows all league members with their status for that race.  


**Three states — design these with distinct emotional weight, not just distinct color:**

- **Submitted** — resolved/done, should read as low-attention once seen.
- **Pending** — before the race's lock/deadline, not yet submitted. Should read as calm/neutral — not alarming, since there's still time.
- **Missed** — after lock, still not submitted. This is the state the whole page exists to surface — should read as a clear flag/warning, more visually prominent than Pending.
- Important constraint: Pending and Missed are mutually exclusive _within a race_ — it's a race-level toggle (lock passed or not), not per-player. So the whole "not submitted" group  
  flips state together. Worth exploring in the workshop: should the page communicate the race's lock state itself (e.g. "submissions open" vs "closed") as context above the member list,
  so the Pending/Missed label makes sense at a glance?  


**Sort/emphasis requirement:** Not-submitted members (Pending or Missed) must surface above Submitted members — the primary scan pattern is "who's outstanding," not an alphabetical  
 roster. This is a hard requirement from the client, not just a suggestion — good thing to anchor the workshop around.

**Explicitly out of scope this round** (don't design toward these, but don't box them out either):

- No scoreboard-facing indicator/checkmark (deferred).
- Not visible to all users — commissioner-only for now.
- No Players-tab placement.
- No lineup-content inspection — status only, not a review/approval flow.
- No cross-race/historical view (e.g., "who misses lineups often").  


**One open dependency to flag in the workshop:** the Pending/Missed distinction assumes a per-race lock/deadline timestamp exists and is queryable. If the workshop wants to show  
 things like a countdown or "locks in X hours," confirm that data is actually available before designing around it
