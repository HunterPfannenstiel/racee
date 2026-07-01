## Submission Status Page — UI/UX Handoff

**Purpose:** Commissioner-only tool to spot who hasn't submitted their lineup for a race, before it's too late to matter. Read-only status — no per-row actions, no lineup content  
 inspection.

**Reused components (already built, not part of this handoff):**

- Race selector
- Members-list component (needs a status slot added — see below)  


**Page composition, top to bottom:**

1. **Header** — plain page title, no extra chrome.
2. **Race selector** — existing component, defaults to next upcoming race.
3. **Lock-state `Alert`** directly below the selector:
   - Submissions open → neutral/default variant, e.g. "Submissions open — closes [time]" (only show the time if a per-race lock timestamp is actually available — unconfirmed  
     dependency, flag if it's not).
   - Submissions closed → `destructive` variant, "Submissions closed."
4. **Outstanding section** (Pending + Missed together):
   - Small muted count label, e.g. "3 outstanding."
   - Members-list instance, filtered to non-submitted members.
   - If this group is empty, swap the whole section (label + list) for an `Empty` state with a positive message ("Everyone's in").
5. **`Separator`**
6. **Submitted section**:
   - Small muted count label, e.g. "8 submitted."
   - Members-list instance, filtered to submitted members.  


**Row anatomy — identical skeleton in both list instances:**  
 `Avatar` → name → flexible spacer → **status slot** (right-aligned, trailing edge)

- **Missed** rows (Outstanding list): solid `destructive` `Badge` in the status slot. High visual weight — this is the row that should catch the eye first.
- **Pending** rows (Outstanding list): `outline`/`secondary` `Badge`, muted tone. Calm, not alarming.
- **Submitted** rows: no badge — just a quiet muted checkmark icon in the same slot. Wrap it in a `Tooltip` that reveals the exact submission timestamp on hover/tap. Keep it out of  
  the default view; the row should stay visually boring at a glance.  


**Key intent to preserve:** Pending and Missed are mutually exclusive at the race level (driven by the lock-state Alert, not per-member), and outstanding members must always surface  
 above submitted ones — that sort order is a hard requirement, not a style choice.

Let me know if anything above is ambiguous once you're in the code — happy to clarify intent, but layout/visual decisions were the point of this workshop and should be considered  
 settled.
