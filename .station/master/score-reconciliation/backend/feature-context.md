Here are the commissioner actions on the prediction page itself, scoped to what you'll need to account for:

**Actions:**

1. **View any race** — the race list isn't filtered/restricted by lock status when the actor is the commish. Every race (past, current, future) is selectable.
2. **View the target user's existing prediction** for whichever race is selected — lineup order + prop picks, pre-populated.
3. **Edit the lineup order** for any race, regardless of whether that race has started/finished/locked for normal users.
4. **Edit prop picks** for any race, same no-lock condition.
5. **Submit/save the edit** — this writes the updated prediction for that race.
6. **Score recalculates automatically** on submit, using the existing scoring algorithm — no separate re-score trigger, no special-cased logic for commish-originated edits vs normal  
   edits.  


**Key distinctions from the normal user flow you'll need to handle:**

- The prediction being edited belongs to a **different user** than the one authenticated/acting (commish acts on behalf of `userId` X, not themselves). The page needs to operate  
  against a target user's prediction, not the caller's own.
- **Race lock checks must be bypassed** when the actor is the commissioner — this is the core behavioral difference from the standard prediction page. Normal users are blocked from  
  editing locked/past races; commish is never blocked.
- No new "edit mode" flag needs to persist anywhere — it's purely "is the acting user the commish, and are they targeting someone else's prediction" that toggles the lock bypass.
- No audit trail, no notification, no approval step — out of scope for this pass.  


Out of scope for this implementation: no on-the-fly score delta preview yet (future idea), no standings-impact preview, no guard rails/restrictions on when edits can happen.
