Here's the rundown for the Commish Score Correction frontend, based on the component we just refactored for exactly this purpose:

## Core component: `PredictionEditor`

`/Users/hunterpfannenstiel/projects/racee/my-app/components/prediction/PredictionEditor.tsx`

This is the single race/player prediction editing surface (driver lineup drag-reorder + prop picks + submit). It's fully self-contained — owns its own DnD sensors and internal state  
 (`orderedRacerIds`, `propPicks`) seeded from props at mount.

Key points for this feature:

- **No race locks apply** — just pass `isLocked={false}` always. The component has zero internal lock/date logic; `isLocked` is a plain prop the parent computes (or, for commish,  
  doesn't). Nothing in its children (`SortableRacerRow`, `PropPicker`) has hidden date checks either — they only respect the `disabled` boolean handed to them.
- **Submit hands back exactly what scoring needs** — `onSubmit(racerIds, propPicks)` gives you the final lineup + picks; wire that straight to whatever commish-save endpoint triggers  
  recalculation. Don't add a notification call — spec says none should fire.
- **Attribution props already exist for "editing someone else's prediction"** — `submittedByName`, `accentColor`, `variant="outline"` were built for the teammate-proxy flow and are a  
  direct fit for showing whose prediction the commish is editing.
- **State is mount-scoped.** `initialRacerIds`/`initialPropPicks` are only read once via `useState(initial...)`. If you build a tab-style "one race visible at a time" UI, you need a  
  remount key like `app/predict/page.tsx` already does (`key={raceId_playerId}`) or stale data will stick around when switching races/players. If instead you render all races in a  
  scrollable list simultaneously (which fits "most recent highlighted"), this isn't a concern — each race's instance mounts once and stays.
- **`allPropsFilled` still gates the submit button** — if a player never picked props for a race, commish has to fill all of them before submitting, same as the player flow.

## Reference implementation: `PredictionForm`

`/Users/hunterpfannenstiel/projects/racee/my-app/app/predict/PredictionForm.tsx`

This is the player-facing wrapper around `PredictionEditor` — copy its shape for the commish version (fetch/derive data, call save, render `PredictionEditor`). It composes:

- `useRaceLock` (`components/prediction/hooks/useRaceLock.ts`) — skip/bypass this for commish, don't reuse it.
- `usePredictionSave` (`components/prediction/hooks/usePredictionSave.ts`) — posts to `/api/predict/prediction`; you'll likely want a parallel commish-authorized save path here rather
  than reusing this hook directly, since it's keyed to the requesting user.

## Existing "edit on behalf of" precedent

`app/predict/teammate-lineup/` (`TeammateSelector.tsx`, `useTeammateSelector.ts`, `SubmissionAttribution.tsx`) and the `isProxy`/`targetUserId`/`targetUserName` plumbing in  
 `PredictionForm.tsx` / `app/predict/page.tsx` — this is the closest existing analog to commish-edit (one user editing/viewing another's prediction) and is worth looking at for  
 patterns, though it's not a hard dependency.

One thing to nail down on your end before wiring the page: whether the new commish view is tab-style (single race, race selector) or a scrollable all-races list — it changes whether  
 you need the remount-key trick.
