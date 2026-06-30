Here's the new backend surface, all under one route file: `app/api/commissioner/leagues/[leagueId]/players/[userId]/predictions/route.ts`.

## `GET /api/commissioner/leagues/{leagueId}/players/{userId}/predictions`

Auth: caller must be commissioner/co-commissioner of `leagueId` (`requireCommissioner`). Returns 401 `{ error }` otherwise.

Returns **every race** for the league's motorsport — no filtering by lock time or whether the answer key is set (unlike the normal `/api/predict/init` endpoint, which only returns  
 open races).

Response shape (`CommissionerPlayerPredictionsResult`):

```ts
{
  races: {
    id: string;
    title: string;
    label?: string;
    date: string;
    lockTime?: string;
    startingGrid: string[];        // racer ids
    keyIsSet: boolean;
    prediction: {                   // null if userId hasn't predicted this race
      racerIds: string[];
      propPicks: Partial<Record<PropName, string>>;
      submittedAt: string | null;
      submittedBy: string | null;   // who actually submitted it (proxy/commish), if not the user themselves
    } | null;
  }[];
  racersById: Record<string, {
    id: string; name: string; team: string; image?: string; teamColor?: string;
  }>;
}
```

`PropName` is the existing enum (`driverOfDay`, `lapsLed`, `fastestPitStop`, `fastestLap`, `overAchiever`, `underAchiever`, `wrecker`) exported from `lib/schemas`.

Use this to populate the race list (unrestricted, since it's commish mode) and pre-populate the lineup/prop-pick form when an existing `prediction` is present for the selected race.

## `POST /api/commissioner/leagues/{leagueId}/players/{userId}/predictions`

Auth: same `requireCommissioner` guard, 401 on failure.

Body (`CommissionerPredictionMutationSchema`):

```ts
{
  raceId: string;       // uuid
  racerIds: string[];   // uuid[], the lineup order
  propPicks?: Partial<Record<PropName, string>>;
}
```

Note: `leagueId` and `userId` come from the URL path, not the body — don't include them.

Behavior:

- No lock check at all — this route never blocks on `race.isLocked()`, regardless of race state.
- Saves the prediction via the existing `PredictionService.submitPrediction`, with `submittedBy` set to the commissioner's own user id (so it'll show up as proxy-attributed, same  
  field the teammate-proxy flow uses).
- If the race already has its answer key set (`keySetAt !== null`), scoring is recalculated synchronously before the response returns — so standings reflect the edit immediately. If  
  the key isn't set yet, no recalculation happens (nothing to grade against).  


Responses: `200 { ok: true }` on success, `400 { error }` on schema validation failure, `404 { error: "Race not found" }` if `raceId` doesn't exist for the league's motorsport, `401 { 
  error }` if not commissioner.

That's the full contract — nothing else changed. `/api/predict/prediction` (the normal user/teammate-proxy route) is untouched.
