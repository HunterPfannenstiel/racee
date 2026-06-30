Here's what's locked down for the kick/remove-member feature, relevant to backend work:

**Kick/Remove Member — agreed scope:**

- **Effect is forward-only access revocation.** A kicked player loses the ability to view the league and make new predictions. Their _past_ data (predictions, scores, history) stays  
  exactly as-is, untouched. Handling/cleanup of historical data is explicitly deferred to a future session — not in scope now.
- **No special "kicked" state.** A kicked player is treated identically to someone who was never in the league. There's no permanent block, no distinct status flag for "kicked" vs  
  "never joined."
- **Re-join path:** If a kicked player clicks the league's invite link again, they land back in **Pending**, same as a newly-requesting or previously-denied player. So removal needs  
  to be reversible from the player's side via the normal join flow — there's no permanent ban list to maintain.
- **Confirmation:** Commissioner gets a confirmation step before the kick executes (UI/UX side, not yet detailed — coordinate with the designer when relevant, but functionally you  
  just need the action to be a deliberate, confirmed call, not auto-fired).
- **Out of scope this sprint:** Edit Lineup per player, score modification — unrelated, don't worry about those.  


One implication worth flagging since you're on backend: since re-joining just re-uses the existing Pending/invite-link flow, removal likely doesn't need a new "kicked" enum/state  
 distinct from "not a member" — it's effectively just deleting/deactivating their membership record. But that's an implementation detail for you and the user to confirm together, not  
 something we decided in this session.
