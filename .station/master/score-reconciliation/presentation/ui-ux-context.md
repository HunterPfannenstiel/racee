Here's the full UI/UX spec for the commissioner prediction editor page, worked out in this session:

## Context

- Feature: commissioner (or admin) can edit a player's prediction on their behalf — driver lineup order + prop picks. This is **not** a raw score override; the score recalculates from
  the edited prediction.
- Entry point: Players tab, under League Management. Each player row gets an "Edit Player's Lineup" button that opens this page.
- Key difference from the normal prediction page: **no race locks** — commissioner can edit any race (past or present) at any time.
- No notifications sent to the player when their prediction is edited.
- The existing driver drag-drop list + prop picker + submit button component is already built and gets reused as-is — not part of this spec.  


## Page layout (top to bottom)

1. **`Button`** (ghost variant, small, top-left) — "← Back to Players". Simple nav back to the Players tab. (We explicitly decided against a breadcrumb here.)  

2. **`Card`** — identity header:
   - `Avatar` + player name
   - Amber/warning `Badge` reading **"Commissioner Mode"** next to the name
   - Muted helper text below: _"Changes are saved when you press Submit below. The score recalculates immediately upon save and updates the league standings."_  

3. **`Alert`** (info variant) — _"All races are open for editing in commissioner mode — nothing is locked."_ Explains why this page shows no locked-race states, unlike the normal  
   prediction flow.  

4. **Race selector** — reuse whatever the existing prediction page uses for race navigation, most recent race highlighted/active by default. No locked/disabled states should render in
   this mode.  

5. **Prediction picker** — the existing drag-drop driver list + prop picker + submit button, unchanged.  


## Behavior notes

- Submit saves in place and recalculates the score immediately — no auto-redirect back to Players after save, so the commissioner can keep editing other races without re-navigating.
- Out of scope for this pass (don't design against it, but don't preclude it): a live score-delta preview as the commissioner edits, before submitting.  


That's everything from the workshop. Let me know if anything needs more detail before you start building.
