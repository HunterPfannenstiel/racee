# Feature-Specific UX/UI Research Log

## Feature Name: Team Management (Racee)

---

## Step 0: Global Standards Inheritance

**Layout & Frame:** `PageShell` + `Card`/`CardHeader`/`CardContent` is the standard container everywhere (`/teams`, `/admin/teams`, commissioner page). The Teams management UI lives in this pattern — no drawers or modals for the primary flow.

**Styling & Tokens:** shadcn/ui throughout. Section labels use `text-xs font-semibold uppercase tracking-widest text-muted-foreground`. Team color is displayed as a `w-1 self-stretch rounded-full` strip. Default fallback color is `#6b7280`.

**System Feedback:** `ToastContext` for success messages; `Alert variant="destructive"` + dismiss button for errors; `Spinner` for in-flight loading states. All three are already in use on the teams and commissioner pages.

**Guardrail Behavior:** Inline `Alert` directly under the page header — not a modal. Save actions use `disabled={!!saving}` to prevent double-submits while in flight.

**Visual Access States:** Restricted actions are simply not rendered for unauthorized users (e.g., "Join" button only appears for non-members). Commissioner-only controls follow this same pattern — hidden from regular users, not grayed out.

**First-Time / Empty State:** `"No teams yet."` in `text-sm text-muted-foreground` — consistent with existing usage across the app.

**Destruction & Safety:** No confirmed app-wide pattern yet. Teams feature establishes the first one: inline confirmation text on the row with Cancel/Delete options. No modal.

**Support Integration:** Not present in the app; not needed for this feature.

---

## Step 1: The Grounding Phase

### Action A: The Ultimate Human Experience

"If this feature is a massive success, the commissioner will be able to scaffold teams in under 2 minutes and drop every player onto one, while feeling in complete control of the league structure, and completely avoiding the feeling of having to chase players down to self-assign."

### Action B: Baseline Journey Context

**Before using this feature, the user is:** A commissioner who has just created a league and invited players. Everyone is signed up. The commissioner wants to split players into named, colored factions before the first race locks.

**After using this feature, the user will instantly transition to:** Returning to the league overview, confident the structure is set. Players see their team on the standings page alongside the individual leaderboard.

### Action C: The Pleasantness Benchmark

The flow feels like organizing a dinner seating chart — fast, visual, confirm-and-done. No page reloads. No hunt through a settings submenu.

---

## Step 2: Competitor UI Deconstruction

### Sleeper (primary baseline)

In Sleeper, each user *is* their own team (individual fantasy roster). There is no "group of users = one team" concept natively. The closest analog is **divisions in managed leagues**, which are commissioner-only constructs created via a separate dashboard.

- **Entry Point:** Commissioner dashboard → League group → League → Settings. Not surface-level; requires intentional navigation.
- **Core Interface Pattern:** Form-based league setup, linear top-to-bottom. Divisions appear as a dedicated section within league settings.
- **Aha! Moment:** The invite link copy step — one tap and you've sent someone into your league. Fast and frictionless.
- **Key pattern noted:** Team name and avatar are customizable by the *individual player*, not the commissioner. This is a Sleeper-specific decision driven by their personal-roster model. Not applicable to Racee, where teams are organizational units the commissioner owns and controls.

### ESPN Fantasy Football

Commissioner creates divisions, names each team slot, and assigns which player goes into which division — all before the draft. Divisions lock after the draft completes.

- **Entry Point:** League Settings → Divisions & Team Settings — buried three levels deep, frequently cited as hard to find.
- **Core Interface Pattern:** A table/grid showing all player slots with a division dropdown per row. Commissioner changes dropdowns and saves globally.
- **Aha! Moment:** The grid view makes it easy to see all assignments at a glance without scrolling through individual profiles.
- **Key insight:** Locking assignments after a threshold event prevents mid-season reshuffles that corrupt standings history. Racee doesn't have a "draft" but the equivalent threshold would be after the first race result is scored.

---

## Step 3: Competitor Forensic Mining

**Clutter & Confusion findings:**
- ESPN's Divisions UI is frequently cited as hard to find. Players often don't know which division they're in until the schedule is generated.
- Sleeper's managed league team setup is a completely separate flow from normal usage — users without docs are lost navigating to it.

**User Restrictions found:**
- ESPN locks all division changes after the draft — inflexible if a player drops out mid-season or reassignment is needed.
- Sleeper gives commissioners no override on individual team names — a player can set an offensive name and the commissioner cannot change it.

**Visual Noise pitfalls:**
- Both apps show teams/divisions only in schedule or standings context. There is no persistent "your team" badge that travels with the user through the app, which leaves players uncertain about which group they belong to.

---

## Step 4: Low-Fidelity Wireframing & Behavior Specs

### Answers to the Core Design Questions

**Who creates teams (and where)?**

Commissioner only, from `/commissioner/leagues/[leagueId]`. A "Teams" section is added to that page alongside the existing scoring config section. Admin retains full control via `/admin/teams` as a superuser override.

The current `/teams` page allows any signed-in user to create teams — the "New Team" card is removed from that surface. Players can still self-join from `/teams`, but only into teams the commissioner has already created.

**How are players assigned teams?**

Commissioner-assigns as primary; self-select as fallback for unassigned players.

The commissioner sees a list of all signed-up players with a per-row dropdown showing their current team assignment (or "Unassigned"). They can reassign anyone at any time — no hard lock, since this is a small trusted group.

Players who have not been assigned by the commissioner can still self-join from `/teams`. Commissioner assignment always overrides self-selection.

**What can be updated for a team?**

Name and color, commissioner-only. Regular players cannot rename or recolor teams. Players can only change their own team membership.

---

### Wireframe Concept Sketch

**Commissioner League Page — Teams Section**

```
┌──────────────────────────────────────────────────────────┐
│  TEAMS                                                   │
│                                                          │
│  ▌ Red Bulls     Hunter, Jamie               [✎]  [🗑]  │
│  ▌ Ferraris      Alex, Sam                   [✎]  [🗑]  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [color]  [Team name ____________________] [Create]│  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  PLAYER ASSIGNMENTS                                      │
│                                                          │
│  Hunter      [Red Bulls  ▾]                              │
│  Jamie       [Red Bulls  ▾]                              │
│  Alex        [Ferraris   ▾]                              │
│  Sam         [Unassigned ▾]                              │
└──────────────────────────────────────────────────────────┘
```

**Inline edit (pencil icon tapped):**
```
  ▌ [color picker]  [input: "Red Bulls"]  [Save]  [Cancel]
```

**Inline delete confirmation (trash icon tapped on a team with members):**
```
  Delete "Red Bulls"? Members will become unassigned.
  [Cancel]  [Delete]
```

**Delete with no members:** Deletes immediately — no confirmation needed.

---

### Behavior Annotations

**Global Loading State on save:** Each action has a localized spinner (on the button or row) while in flight. The rest of the page remains interactive.

**Global Error State on failure:** `Alert variant="destructive"` appears at the top of the section with a dismiss button. Optimistic UI is rolled back on failure.

**How the interface opens and dismisses (Baseline Journey Context):** The Teams section is a permanent section of the commissioner league page — not a drawer, sheet, or modal. It is always visible when you navigate to `/commissioner/leagues/[leagueId]`. The player-facing `/teams` page remains as a read-only + self-join surface; the create form is removed from it.

**Creating a team:** Spinner on the Create button while saving. New team row appears at the bottom of the list on success. Name input clears; color resets to default. No toast — the new row appearing is confirmation enough.

**Editing a team (name/color):** Pencil icon swaps the row into an inline edit form. Save replaces the row back to read state. Cancel discards changes. Spinner on Save button while in flight.

**Assigning a player:** Dropdown change triggers an immediate per-row save — no bulk "Save All" button. Spinner appears on the row's dropdown while saving. Row updates to show the new team on success.

**Deleting a team:** Trash icon triggers inline confirmation text if the team has members. If empty, deletes immediately. On confirm, row animates out. Members become unassigned and their player assignment row updates to "Unassigned".

**Player-facing `/teams` page:** Retains the team list, "Your Team" card, and self-join buttons for unassigned players. The "New Team" creation card at the bottom is removed. A player who is already on a team sees "Joined" instead of a Join button, matching current behavior.
