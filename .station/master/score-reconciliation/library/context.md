Here's the feature context relevant to your abstraction work:

**What's being built:** A commissioner tool that lets the Commish (or Admin) edit any league player's prediction (lineup + props) at any time, with no race locks — used to manually  
 correct user-submitted predictions after the fact.

**Entry point:** Players tab under League Management. Each player row gets an "Edit Player's Lineup" button. Clicking it opens that player's prediction tab in a commish-edit mode.

**Functional requirements your reusable components need to support:**

- Edits cover everything that feeds into scoring: driver lineup arrangement _and_ props — not a subset.
- All races must be visible and selectable (past and future), with the most recently completed/active race highlighted by default. The existing prediction page already has this race  
  list.
- No locking logic applies in commish mode — races that would normally be locked for the player (e.g., already started/completed) must remain editable when accessed via the commish  
  flow.
- On submit, the score recalculates automatically through the existing scoring algorithm — no special re-score path, no direct score patching.
- No notification is sent to the player when their prediction is changed.  


**Explicitly out of scope for this pass:** any on-the-fly score delta/preview UI, standings-impact preview, audit trail/history of changes. Don't build for those, but the client  
 floated the delta-preview idea as a likely future ask, so it's worth knowing why locking logic and score-recalc are kept decoupled/clean.

**Net effect for your abstraction:** whatever "predict" component(s) currently encode race-lock state and the editing-user identity, those are the two seams that need to flex — the  
 commish flow needs to (1) bypass lock checks and (2) operate on a target player ID different from the logged-in user.
