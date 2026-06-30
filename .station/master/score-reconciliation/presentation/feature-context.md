Here's the vision context relevant to the page itself:

**What the page is:** It should closely mirror the existing player-facing prediction page/tab — same structure, reused as much as possible (client's words: "open that player's  
 prediction tab"). This isn't a new design, it's the existing prediction UI repurposed for commissioner use.

**Race list behavior:** The page shows **all races** (past and future), not just the current one — reuse the race list that already exists on the prediction page. The most recent race
should be highlighted/default-selected.

**Key behavioral difference from the normal prediction page:** No race locks. Normally a user can't edit predictions for races that have started/passed — for the commissioner, **every
race is editable, with no guard rails**. This is the core thing that needs to change vs. the standard prediction page logic.

**What's editable:** Everything that feeds into scoring for that race — driver lineup arrangement **and** props. Not just lineup despite the feature name.

**Submit behavior:** On save, score recalculates automatically through the normal scoring algorithm — no special re-score trigger, no separate confirmation step.

**Notifications:** None. Silent edit, no indication shown to the user that their prediction was changed.

**Out of scope for this pass:** A live on-the-fly score delta/preview as the commish edits was floated as a future idea but is explicitly not part of this build.

**Context you may not need but is good to know:** Entry point is an "Edit Player's Lineup" button per player row on the Players tab (League Management), which is what routes into this
page for a specific player — but that nav/routing piece isn't your focus
