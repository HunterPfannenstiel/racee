Here's the kick/remove member feature as scoped:

**What it does:** Commissioner can remove an approved member from the league.

**Behavior:**

- Forward-only effect — kicked player loses all access (can't view the league, can't make new predictions). Their past data/history stays intact, untouched.
- Kicked player has no special status afterward — they're treated exactly like someone who was never a member. If they click the invite link again, they land back in Pending (same as  
  a denied player would).
- No "you were kicked" messaging — they just see whatever a non-member already sees when trying to access the league.
- This action requires a confirmation step before it executes (it's high-stakes/irreversible-feeling), but the specifics of that confirmation UX are intentionally left to you.  


**Explicitly not decided yet (future session):** what eventually happens to a kicked player's historical data long-term, any permanent block mechanism preventing re-join — none of  
 that is in scope here, don't design for it.

**Where it lives:** Commissioner's Players page, same page as the existing Pending/Members lists.

That's the full scope — the confirmation flow is really the only open design surface here.
