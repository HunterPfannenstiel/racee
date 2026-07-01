Here's the full frontend handoff for the Submission Status page.

## File map

```
app/commissioner/player-status/
├── index.tsx                          — PlayerStatus (composed feature, entry point)
├── LockStateAlert.tsx
├── MemberStatusSection.tsx
├── MembersList.tsx
├── MemberRow.tsx
├── MemberStatusIndicator.tsx
└── hooks/useMockPlayerStatus.ts       — swap this for the real hook

app/commissioner/leagues/[leagueId]/player-status/page.tsx   — the real, live route
app/prototype/player-status/page.tsx                          — isolated-states reference, not wired
```

Live URL: `/commissioner/leagues/[leagueId]/player-status`

## What to change

Everything under `app/commissioner/player-status/` except `hooks/useMockPlayerStatus.ts` is done — pure presentation, don't touch it. Your job is a new `hooks/usePlayerStatus.ts` with
the same return shape (see below), and swapping the import in `index.tsx`:

```ts
// app/commissioner/player-status/index.tsx, line 3
import { useMockPlayerStatus } from "./hooks/useMockPlayerStatus";
// →
import { usePlayerStatus } from "./hooks/usePlayerStatus";
```

`PlayerStatus` currently takes no props and calls the hook with no args. `page.tsx` (`app/commissioner/leagues/[leagueId]/player-status/page.tsx`) already pulls `leagueId` via  
 `useParams` for the back-link — you'll need to thread it into `PlayerStatus` and the hook, mirroring `app/commissioner/players-list` (`PlayersList({ leagueId })` →  
 `usePlayersList(leagueId)`, real fetch, `useState`/`useEffect`, no context library in this codebase).

## Required hook contract

`usePlayerStatus(leagueId: string)` must return:

```ts
{
  races: { id: string; title: string; date: string }[];
  selectedRaceId: string;              // non-null; hook owns the default-selection
  setSelectedRaceId: (id: string) => void;
  locked: boolean;                     // true if selected race's lock has passed
  lockTime: string | null;             // ISO datetime; null if not available
  outstanding: MemberSubmission[];     // pending + missed, for the selected race
  submitted: MemberSubmission[];       // submitted, for the selected race
}
```

`MemberSubmission`:

```ts
type SubmissionStatus = "submitted" | "pending" | "missed";
type MemberSubmission = {
  id: string;
  name: string;
  status: SubmissionStatus;
  submittedAt: string | null; // ISO, only set when status === "submitted"
};
```

## Key business rule baked into the mock — preserve it

`status` is **derived**, not stored per-member: `submittedAt ? "submitted" : locked ? "missed" : "pending"`. Pending/Missed is a race-level toggle (did lock pass), not a per-member  
 flag — that's a hard requirement from the UI/UX spec (`.station/master/player-status/ui-ux/clarity-context.md`). Don't let the backend give you a per-member "missed" status directly;  
 derive it from the race's lock state + whether they submitted.

Sort order matters too: `outstanding` (pending+missed) must render before `submitted` — `index.tsx` already handles that by rendering the two `MemberStatusSection`s in that order, but
if you reshape the hook, keep them as two separate arrays, not one sorted list, since `MemberStatusSection` also needs `outstanding.length === 0` to trigger the `Empty` state.

## Flagged dependency

`lockTime` is `string | null` on purpose — `LockStateAlert.tsx` only renders the "closes [time]" text when it's non-null, otherwise falls back to a plain "Submissions open." The UI/UX
doc flagged this as an unconfirmed dependency: confirm a per-race lock/deadline timestamp is actually queryable. Note `lib/schemas.ts` already has `RaceSchema.lockTime` (optional  
 `datetime` string) — that's likely your source, but I didn't wire to it since presentation stayed on mock data only.

## Selection defaulting

The mock hook defaults `selectedRaceId` to `MOCK_RACES[0].id`. The spec says default to "next upcoming race" — that logic isn't implemented anywhere in the mock (there was no real  
 date-comparison need with 2 mock races). You'll need to add that, similar to `pickDefaultRaceId` in `app/commissioner/lineup-editor/hooks/useLineupEditor.ts:28-34` (past races sorted  
 desc, falls back to earliest upcoming).

## Reused components (don't modify)

- `RaceSelector` from `@/components/prediction/RaceSelector` — takes `{ races, selectedRaceId, onSelect }`, races need only `{id, title, date}`. This is the live one (used in  
  `/predict` and `lineup-editor`) — there are two other unused/dead race-selector-ish components in the repo (`components/ui/race-select.tsx`, `components/ui/race-picker.tsx`,  
  `app/predict/RacePicker.tsx`) — ignore those, don't import them.
- `Empty` (`components/ui/empty.tsx`) — newly added via shadcn CLI for this feature, wasn't in the project before.  


## Scope not covered (intentionally, per session role)

No auth guard on `page.tsx` (other real commissioner pages use `requireCommissioner`/`getSession` server-side — this one's still a bare client page), not linked from the league hub's  
 card grid (`app/commissioner/leagues/[leagueId]/page.tsx` `CARDS` array), no API routes exist yet.
