# Picks Page Redesign — Research & Handoff

Full context for implementing the picks page revamp. Everything another agent needs to continue without gaps.

---

## Context

The picks page (`/picks/[userId]`) shows a single user's predictions for one specific race. It is a results review screen — the race is over and graded. The user navigates here from a race card in the Results tab (league + race passed via URL params `?leagueId=&raceId=`).

The page is NOT a live/active screen. It is always post-race. Race state is `FINISHED`.

---

## Design System Quick Reference

All tokens are already implemented as Tailwind utilities in `my-app/app/globals.css`. Never define values inline.

**Aesthetic:** Pit Lane Industrial — dark, dense, precise. F1 timing screen / pit wall monitor energy.

**Key surfaces:**
- `bg-base` (#0A0A0B) — app background
- `bg-surface` (#121214) — card backgrounds
- `bg-elevated` (#1C1C1F) — modals/overlays
- `bg-subtle` (#242428) — hover/selected rows

**Key text:**
- `text-primary` (#F0F0F2)
- `text-secondary` (#8A8A95) — labels, metadata
- `text-tertiary` (#4A4A55) — placeholder, disabled

**Key semantic:**
- `state-success` (#22C55E) — correct prediction, non-zero points
- `state-error` (#E8002D) — wrong prediction
- `accent` (#FFD700) — perfect prediction indicator, gold highlight
- `accent-muted` (#3D3000) — badge background for accent

**Typography:**
- Display/Title: `Barlow Condensed` (race names, big numbers, section headers)
- Body/Data: `IBM Plex Mono` (scores, times, prop values, position numbers)
- Mono-Large: IBM Plex Mono, 24px, weight 700 — hero scores
- Label: IBM Plex Mono, 13px, weight 500, all-caps, letter-spacing 0.08em — section headers
- Caption: IBM Plex Mono, 11px, weight 400 — metadata

**Spacing:** 4px base unit. Screen-edge padding: always 16px.

**Design doc location:** `/docs/design/` — read `index.md` first.

---

## Current Implementation (What Exists Today)

**Files:**
- `app/picks/[userId]/page.tsx` — page shell, data fetching, state
- `app/picks/[userId]/PicksGrid.tsx` — driver prediction rows
- `app/picks/[userId]/PropChips.tsx` — prop bets as pill chips

**Current data flow:**
1. Page fetches `/api/leagues` and `/api/racers` on mount
2. League selection triggers fetch of `/api/races?leagueId=`
3. Race selection triggers fetch of `/api/profile/race?leagueId=&raceId=&userId=`
4. `computeDriverPoints()` runs client-side to calculate per-driver points from prediction + key + placement point schedule

**RaceData shape returned by `/api/profile/race`:**
```ts
type RaceData = {
  prediction: string[] | null;       // ordered array of racerIds (user's predicted order)
  key: string[] | null;              // ordered array of racerIds (actual finish order)
  propPicks: Record<string, string>; // propName → racerId or team name
  propKey: PropKey | null;           // propName → string[] | null (accepted answers)
  scores: {
    gridPoints: number;
    propPoints: number;
    medal: string | null;
  } | null;
  rank: number | null;               // user's rank in this race
  totalParticipants: number;
  placementPoints: number[];         // scoring schedule, e.g. [20, 10, 5, 2, 1, 0, 0...]
  propPointValues: PropPointValues | null;
};
```

**Current layout (top to bottom):**
1. LeaguePicker (tabs)
2. RaceSelect (dropdown/tabs)
3. Score summary — `{total} pts` in h2, bullet list: `{grid} grid · {prop} prop points`, rank
4. PicksGrid — driver list in predicted order, each row: `team-color-bar | avatar | name/team | P{pred} → P{actual} | ±delta | points`
5. PropChips — floating pills: `Prop Label · Pick Name · N pts` (green/red ring)

**What's wrong with it:**
- Score is buried in small text — users want this first and large
- Pills are a summary format; a dedicated picks page needs table rows
- Delta coloring is misleading (+N in green/−N in red implies direction = good/bad, but direction has no scoring meaning)
- No section headers or visual separation between grid and prop picks
- Rank mixed with small metadata text instead of being a prominent companion to the score
- No indication for ungraded races (currently shows empty prediction or nothing)
- LeaguePicker/RaceSelect are prominent even when params are passed via URL

---

## Research Findings

### From Sleeper, PrizePicks, F1 Fantasy, ESPN Fantasy

**Hierarchy finding (universal pattern):** Total score is the hero element — it's what users want first. Rank is shown immediately below or adjacent. Individual pick details are for post-mortem scrolling, not the first read.

**Correct/incorrect treatment:** Green checks and red X marks on each row. Color-saturated for hits, desaturated/dim for misses. Full-row tinting (subtle success bg) for correct picks is common and effective.

**Props vs. grid separation:** F1 Fantasy naturally separates drivers from constructors in two distinct sections. For a prediction app with grid-order picks + prop bets, section headers are the right divider — don't mix them.

**Rank placement:** Shown inline near the total score. Full leaderboard is one tap away, not inlined. Keeps focus on individual performance with curiosity-driven exploration optional.

**Ungraded races:** Most apps show the submitted picks without outcome data — prediction is visible but no ✓/✗ until results post. This is the right pattern.

---

## Proposed Layout

This is mobile-first (390px). The page scrolls vertically.

### Component & Layout Hierarchy

```
┌─────────────────────────────────────────────┐
│  ZONE 1: Race Context Header                │
│  ─────────────────────────────────────────  │
│  MONACO GP · R8                [FINISHED]   │
│  (Title 2, Barlow Condensed)  (state badge) │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│  ZONE 2: Hero Score Block                   │
│  ─────────────────────────────────────────  │
│                                             │
│              167 PTS                        │
│          (Mono-Large, text-primary)         │
│                                             │
│             #2 OF 8                         │
│          (Caption, text-secondary)          │
│                                             │
│        142 grid  ·  25 props               │
│        (Caption, text-tertiary)             │
│                                             │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│  ZONE 3: Grid Predictions Section           │
│  ─────────────────────────────────────────  │
│  GRID PREDICTIONS                           │
│  (Label, all-caps, text-secondary)          │
│                                             │
│  [Row] Hamilton   P1 → P1   ✦      20 pts  │
│  [Row] Leclerc    P2 → P3   +1      8 pts  │
│  [Row] Verstappen P4 → P2   −2      8 pts  │
│  [Row] Sainz      P1 → P5   +4      0 pts  │
│  ...up to scoringDepth drivers              │
│                                             │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│  ZONE 4: Prop Picks Section                 │
│  ─────────────────────────────────────────  │
│  PROP PICKS                                 │
│  (Label, all-caps, text-secondary)          │
│                                             │
│  Driver of the Day   Hamilton   ✓   25 pts  │
│  Fastest Lap         Leclerc    ✗    0 pts  │
│  Wrecker             Norris     ✓   15 pts  │
│  Laps Led            —          —    — pts  │  ← not picked, dimmed
│  ...                                        │
└─────────────────────────────────────────────┘
```

### Zone Breakdown

| Zone | Component | Notes |
|---|---|---|
| 1 — Race Context Header | Static text | Race title (Title 2) + [FINISHED] badge. Shown once league+race are selected. |
| 2 — Hero Score Block | `PicksHero` (new) | Mono-Large total, Caption rank, Caption split. Only shown when `scores` is non-null. |
| 3 — Grid Predictions | `PicksGrid` (refactor) | Driver rows with team color bar, avatar, name, P→P notation, accuracy indicator, points. |
| 4 — Prop Picks | `PropRows` (replace `PropChips`) | Table rows replacing pills. All props shown including unpicked ones (dimmed). |

---

## Detailed Spec: Each Zone

### Zone 1 — Race Context Header

- Show race title from the selected `Race.title` + optional `Race.label`
- `[FINISHED]` badge: all-caps, `text-secondary`, `border-default` border, monospace
- This zone replaces the need for prominent league/race pickers once params are set
- The LeaguePicker and RaceSelect should be kept for direct navigation (no params) but should be visually minimal — not section-level elements

### Zone 2 — Hero Score Block (`PicksHero`)

```tsx
// Only renders when raceData.scores !== null
// Props:
{
  totalPoints: number;       // gridPoints + propPoints
  rank: number | null;
  totalParticipants: number;
  gridPoints: number;
  propPoints: number;
}
```

- `totalPoints` in Mono-Large (`text-2xl font-mono font-bold`)
- `#N OF M` in Caption (`text-xs font-mono text-secondary uppercase tracking-widest`)
- `{grid} grid · {prop} props` in Caption, `text-tertiary`
- Center-aligned block, `space-y-1` between lines
- `space-6` (24px) vertical padding within the block

### Zone 3 — Grid Predictions (`PicksGrid` refactor)

**Row anatomy (each driver):**
```
[2px team-color bar] [32px avatar] [name+team flex-1] [P{pred}→P{actual}] [accuracy] [points]
```

**Accuracy indicator — new design decision:**

| Offset | Indicator | Color |
|---|---|---|
| 0 (perfect) | `✦` symbol | `accent` (#FFD700) — gold |
| 1–2 | `+N` or `−N` | `text-secondary` — neutral |
| 3+ | `+N` or `−N` | `text-tertiary` — dimmed |

**Sign convention:**
- `+N` = driver finished N positions *lower* in the order than predicted (worse result than you expected)
- `−N` = driver finished N positions *higher* than predicted (better result than you expected)
- Sign is directional data only. **No coloring based on sign direction.** The color is based on magnitude.

**Row background tinting:**
- Points earned > 0: `bg-state-success/5` subtle tint (barely-there green wash)
- Points earned = 0: default `bg-surface`

**Points column:**
- > 0: `state-success` color, `{N}pts`
- = 0: `text-tertiary` color, `0pts`

**Ungraded race behavior:**
- When `key` is null (race not yet scored): hide the grid section entirely. Show only the submitted prediction order with no actual positions or points. Add a "AWAITING RESULTS" caption below the section header.

**`computeDriverPoints` stays client-side** in `page.tsx` as-is — no change needed.

### Zone 4 — Prop Picks (`PropRows`, replaces `PropChips`)

**Replace pills with table rows.** This is a dedicated picks page — pills are too compressed.

**Row anatomy:**
```
[Prop Label (flex-1)]   [Pick Name]   [✓ or ✗ or —]   [N pts]
```

**Show ALL 7 props**, not just picked ones:
- **Picked + graded correct**: `state-success` check + `state-success` points
- **Picked + graded incorrect**: `state-error` × + `text-tertiary` zero
- **Picked + ungraded**: pick name shown, no icon, `text-tertiary` for points col
- **Not picked**: `—` for name, no icon, `text-tertiary` for everything

The full list approach (vs. filter-to-picked) lets users see what they left on the table.

**Prop display order:** follow the `PROP_NAMES` array in `PropChips.tsx`:
```
driverOfDay, lapsLed, fastestPitStop, fastestLap, overAchiever, underAchiever, wrecker
```

---

## Files to Create / Modify

| File | Action | What |
|---|---|---|
| `app/picks/[userId]/page.tsx` | Modify | Remove score block from top, add `PicksHero`, conditionally hide grid/prop sections |
| `app/picks/[userId]/PicksGrid.tsx` | Modify | Accuracy indicator (✦ / ±N), row tinting, ungraded state |
| `app/picks/[userId]/PropChips.tsx` | Replace | New `PropRows` component — table rows, all props shown |
| `app/picks/[userId]/PicksHero.tsx` | Create | Hero score block (Zone 2) |

---

## Design Decisions Locked In

1. **LeaguePicker/RaceSelect**: kept but not part of the revamp — they will be removed later. Ignore them for now.
2. **Grid section when ungraded**: hidden entirely until race has a `keyOrder`.
3. **Props not picked**: show dimmed rows at the bottom of the props list.
4. **Delta direction**: keep signed ±N, but neutral color (magnitude-based), not direction-based. Perfect pick = gold ✦ replaces the number entirely.

---

## Documentation Gap to Fill

The design docs (`/docs/design/results.md`) do not document "Prediction Accuracy Indicators" — the ✦ / ±N pattern described above is new. Once the component is built and confirmed, add a section to `results.md` under "Race Results Detail Screen" documenting:
- The accuracy indicator convention (✦ for perfect, ±N neutral, magnitude coloring)
- Row tinting for scored rows
- PropRows as the standard for prop results (not pills)
