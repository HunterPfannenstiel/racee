## Endpoints

**`GET /api/commissioner/leagues/[leagueId]/players`**  
 Returns both lists in one call:

```ts
{
  members: LeaguePlayerDTO[];
  pending: LeaguePlayerDTO[];
}

type LeaguePlayerDTO = {
  id: string;
  name: string;
  role: "co-commissioner" | "member";
};
```

Note: pending players always have `role: "member"` (role only matters once they're approved).

**`POST /api/commissioner/leagues/[leagueId]/players/[userId]/accept`**  
 Moves a pending player into members. No body required.  
 Response: `{ ok: true }`

**`POST /api/commissioner/leagues/[leagueId]/players/[userId]/deny`**  
 Drops a pending player (not a ban — they can re-invite-link their way back in).  
 Response: `{ ok: true }`

## Auth / errors

All three routes are gated by `requireCommissioner(leagueId)`. If the caller isn't the commissioner or a co-commissioner, you get:

```ts
{
  error: string;
}
```

with HTTP status `401`.
