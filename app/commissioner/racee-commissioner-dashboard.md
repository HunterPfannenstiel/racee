# Commissioner Dashboard — Design Document

## Purpose

The commissioner dashboard is the management hub for a league. It is scoped strictly to league management — not standings, not race results, not global driver data. Basic at-a-glance league stats are surfaced as context, not as a reporting tool.

---

## Route Structure

```
/commissioner                                   ← Your leagues list (unchanged)
/commissioner/leagues/[leagueId]                ← Hub: stat strip + management cards
/commissioner/leagues/[leagueId]/settings       ← League scoring config (moved from hub)
/commissioner/leagues/[leagueId]/teams          ← Team creation + player assignment (new)
```

---

## `/commissioner` — League List

No changes. Already works: lists the commissioner's leagues as cards, links to each hub.

---

## `/commissioner/leagues/[leagueId]` — Hub

### Layout

```
← Commissioner

[League Name]

┌──────────────────────────────────────┐
│  8 players · 2 teams · 3 unassigned  │
└──────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐
│  ⚙  Settings     │  │  👥 Teams        │
│                  │  │                  │
│  Scoring, props, │  │  Create teams,   │
│  and league name │  │  assign players  │
└──────────────────┘  └──────────────────┘
```

### Stat Strip

A single muted line showing three numbers derived from the teams data fetched at load time:

- **X players** — total unique memberIds across all teams in this league
- **Y teams** — count of teams
- **Z unassigned** — players who appear in the global user list but are not on any team

All three numbers come from the same `/api/leagues/[leagueId]/teams` response already used elsewhere. No additional API call required. If all players are assigned, "0 unassigned" is omitted.

### Management Cards

Two cards using the same pattern as `/admin`:

| Card | Icon | Description | Links to |
|---|---|---|---|
| Settings | `Settings2` | Scoring, props, and league name | `/commissioner/leagues/[leagueId]/settings` |
| Teams | `Users` | Create teams and assign players | `/commissioner/leagues/[leagueId]/teams` |

The hub page is a **server component**. Data for the stat strip is fetched server-side. No client state needed on this page.

---

## `/commissioner/leagues/[leagueId]/settings` — League Settings

The existing `LeagueConfigSection` component moves here unchanged. This is the current content of the hub — just relocated to its own sub-page with a back link to the hub.

```
← [League Name]

LEAGUE SETTINGS
[name, placement points, mulligans, stages, scoring depth, prop point values, Save]
```

---

## `/commissioner/leagues/[leagueId]/teams` — Teams

Full spec is in `racee-teams-feature-research.md`. Summary:

```
← [League Name]

TEAMS
▌ Red Bulls    Hunter, Jamie    [✎] [🗑]
▌ Ferraris     Alex, Sam        [✎] [🗑]

[color] [Team name ___________] [Create]

PLAYER ASSIGNMENTS
Hunter     [Red Bulls  ▾]
Jamie      [Red Bulls  ▾]
Alex       [Ferraris   ▾]
Sam        [Unassigned ▾]
```

Commissioner creates and edits teams. Commissioner assigns players via per-row dropdown. Players who are unassigned can still self-join from `/teams` (the player-facing page) as a fallback.

---

## Behavior Notes

- The hub is a **server component**; stats are rendered on the server.
- Settings and Teams pages are **client components** (they have form state).
- Back links on sub-pages navigate to the hub (`← [League Name]`), not to `/commissioner`.
- The `/commissioner` league list back link remains (`← Commissioner`) on the hub.
- No tabs. Navigation is card-based at the hub level, sub-pages are full pages.
