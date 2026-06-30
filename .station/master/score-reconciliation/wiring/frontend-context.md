## Mock data to replace

**`app/commissioner/lineup-editor/hooks/useMockLineupEditor.ts`** — this whole file is the swap point. Replace it with a real hook (e.g. `useLineupEditor.ts`, following the  
 `usePlayersList.ts` pattern next to its `useMockPlayersList.ts` sibling) that:

- Takes `leagueId` and `userId` as params (already plumbed through — see below)
- Fetches and returns the same shape currently returned by the mock hook:
  - `player: { id, name, avatarUrl?, teamColor? }`
  - `races: { id, title, date, startingGrid: string[] }[]` — **all races, past and future**, not just open ones
  - `racersById: Record<string, Racer>`
  - `predictions: Record<raceId, { racerIds, propPicks, submittedAt, submittedByName }>`
  - `selectedRaceId` / `setSelectedRaceId` — selection logic (most-recent-past-else-earliest-upcoming) can stay client-side or move server-side, your call
  - `saveRacePrediction(raceId, racerIds, propPicks)` — needs to actually POST and trigger score recalculation  


## Wiring point

`app/commissioner/lineup-editor/index.tsx` line 19-20 is the only place the hook is consumed:

```ts
const {
  player,
  races,
  racersById,
  predictions,
  selectedRaceId,
  setSelectedRaceId,
  saveRacePrediction,
} = useMockLineupEditor();
```

Swap that import/call for your real hook — nothing else in `index.tsx` or `PlayerIdentityCard.tsx` needs to change since they're already typed against this shape.

## Other relevant frontend context

- **`LineupEditor` already receives `leagueId` and `userId` as props** (`app/commissioner/lineup-editor/index.tsx:13-16` and `:18`) — `userId` is currently unused (only `leagueId` is  
  destructured) since the mock hook ignores it. You'll want to pass both into your real hook.
- **Route**: `app/commissioner/leagues/[leagueId]/players/[userId]/lineup/page.tsx` reads `leagueId`/`userId` from `useParams` and passes them straight through — that part's already  
  correct, no changes needed there.
- **No lock logic anywhere** — `PredictionEditor` is called with `isLocked={false}` and `lockCountdown={null}` hardcoded (`index.tsx:52-53`). Don't reuse `useRaceLock`.
- **Submit gives you exactly what scoring needs**: `onSubmit(racerIds, propPicks)` → wired to `saveRacePrediction(selectedRace.id, racerIds, propPicks)`. That's your save payload.
- **No notification call exists anywhere in this feature** — intentional per spec, don't add one.
- **`saving`/`saved` are hardcoded `false`** (`index.tsx:54-55`) — once you wire a real async save, thread real loading/success state through here (mirror how `usePredictionSave.ts`  
  does it for the player-facing flow) so the submit button shows a spinner/disabled state correctly.
- **Entry-point button is NOT wired** — there's no "Edit Player's Lineup" button on the Players tab (`app/commissioner/players-list/MemberRow.tsx`) linking here yet. That's still open
  if you need it for navigation to work end-to-end.
- **`PredictionEditor` and `RaceSelector` are reused unmodified** from `components/prediction/` — no changes were made to those, so the player-facing `/predict` flow is unaffected.
