Here's where the Players feature stands from our last sparring session:

**Scope locked for this sprint (visuals/setup only, nothing implemented yet):**

The Commissioner Players page shows two lists:

1. **Pending** — anyone who clicked the league's invite link but hasn't been approved yet. Commissioner can Accept or Deny each one.
2. **Members** — all approved players in the league.  


**Invite link context:** Invite links already exist in the app and are global to a league (commissioner can enable, disable, regenerate them). The Players page approval gate is the  
 safeguard against mass joins from a leaked/shared link — nobody auto-joins, everyone lands in Pending first.

**Denied players:** If someone is denied and clicks the invite link again, they simply re-appear in Pending. No permanent block yet — that's an acknowledged future mechanism, not this
sprint.

**Kicking/removing members — this is the open thread.** It's on the client's checklist, but we explicitly did NOT lock down behavior for it in the last session. The client's notes  
 describe a "kick players" ability on this same page, but said this sprint is just visuals/setup as a foundation for future member-specific actions (kick included). So:

- Whether "kick" ships visually this sprint (button present, not wired) or is deferred entirely is unresolved — that's likely what this sparring session is for.
- We never discussed: what happens to a kicked player's data/history, whether they're blocked from re-joining via the invite link or can re-pend like a denied player, or any  
  confirmation/undo behavior.  


**Explicitly out of scope for this sprint (confirmed, not just unresolved):** Edit Lineup per player, score modification — those are future-session items, unrelated to the kick  
 question.

That's the full context — go into the session knowing kick/remove is the one item the client listed but we left undefined
