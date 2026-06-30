Here's what's been discussed for the Players page, under the Commissioner Menu:

**Layout: Two distinct lists**

1. **Pending** — players who clicked the invite link and are awaiting commissioner approval. Each row needs an Accept and a Deny action.
2. **Members** — players who have been approved and are active in the league.  


**Behavioral context relevant to the visuals:**

- A denied player can click the invite link again and pop back up in the Pending list — so Pending isn't necessarily a one-time/disappearing queue, it should read as a living list.
- This sprint is scoped to the **visual/presentational layer only** — building the page and these two lists as a foundation for future work.
- Future sessions will add per-member actions (the Members list is being set up to eventually support row-level actions beyond just viewing).  


**Flagged but not yet confirmed in scope:** a Kick action on the Members list was raised as a possibility for this sprint but has not been locked in by the client — worth confirming  
 before you design for it, or build the row in a way that could accommodate an action button later without it being required now.

That's the full extent of what's been discussed — no backend/data-model decisions have been finalized in this conversation, so don't infer field names, states, or API shapes from this
thread.
