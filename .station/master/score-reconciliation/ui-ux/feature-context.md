Here's the full context for this feature: **Commish ability to change/modify scores**.

**Why it exists:** Full migration to the app, plus a need to fix existing incorrect scores caused by user error (users who want to change a prediction after the fact).

**The actual mechanism:** This is _not_ a raw score override. Scores are computed by a scoring algorithm from a user's prediction (driver lineup arrangement + prop picks). So "fixing
a score" really means the commissioner edits the underlying prediction on the user's behalf, and the score recalculates naturally from that.

**Who can do it:** Commissioner (or Admin) only. Not the user themselves — this is explicitly a commish-mediated action, since normally users can't edit predictions after a lock.

**Entry point:** Players tab, under League Management. There's already a list of players there. Each player row gets a new **"Edit Player's Lineup"** button.

**What happens on click:** It opens that player's prediction tab/page — reusing the existing prediction UI almost exactly (the client's words: "abstract a few things out of it and
reuse all of that for this"). The page already has a race list, which gets reused here.

**Key behavioral difference from the normal prediction flow:** No race locks. Normally races lock at some point so users can't edit. In commish-edit mode, _no races are locked_ — the
commissioner can change any prediction for any race, past or present, at any time. No other guard rails. Client's framing: "it's their league, their rules."

**Scope of editability:** Everything that feeds into scoring — both the driver lineup order and the prop picks.

**Race list display:** All races shown, with the most recent one highlighted (mirroring however the existing prediction page surfaces races).

**Save behavior:** Score recalculates automatically and immediately on submit. No manual "re-score" step, no special logic for this first pass.

**Notifications:** None. The user is not notified when their prediction is changed by the commish. Explicitly simple for now.

**Explicitly out of scope for this pass (future idea, not being designed now):** An on-the-fly score delta preview — showing the commish what the new score would be (and possibly
standings impact) as they edit, before submitting. Good to keep in mind as a direction the UI shouldn't preclude, but not part of this build.

That should give you what you need to start a UI/UX plan that mirrors the existing prediction page while accounting for the commish-mode differences (entry point on the Players tab,
unlocked races, no notification surface needed).
