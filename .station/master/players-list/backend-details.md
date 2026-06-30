## Players Page — Backend Context

**Feature:** A Players page under the Commissioner Menu for a league.

**Two player states to support:**

1. **Pending** — a user who clicked the league's invite link but hasn't been approved yet.
2. **Members** — a user who has been approved into the league.  


**Actions the commissioner can take on Pending players:**

- **Accept** → moves them into Members.
- **Deny** → removes them from Pending. They are not blocked permanently — if they click the invite link again, they re-enter the Pending list. (A more permanent block/ban mechanism  
  is a future consideration, not this sprint.)  


**Invite link behavior:** Invite links are already implemented — they're global per league, and commissioners can enable/disable/regenerate them. Clicking the link does **not**  
 auto-add someone as a Member — it puts them into Pending, which is the safeguard against mass/unauthorized joins from a widely-shared link.

**This sprint's scope:** Visuals and the underlying Pending/Member list structure plus Accept/Deny. This is explicitly being set up as groundwork for future per-member actions (e.g.  
 kicking existing members, editing a player's lineup/predictions as commissioner) — those are **not** part of this sprint, but the data model should anticipate more actions being hung  
 off each player row later.
