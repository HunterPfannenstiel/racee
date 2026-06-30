Here's the full spec for the kick/remove member feature, as workshopped with the product champion:

## Feature

Commissioner can remove an approved member from the league, from the **Players page** (same page as the existing Pending/Members lists).

## Behavior (already scoped, not up for redesign)

- Forward-only effect — kicked player immediately loses all access (can't view league, can't make predictions). Their past data/history is untouched.
- No special "kicked" status — they're treated exactly like someone who was never a member. If they reuse the invite link, they land back in Pending.
- No "you were kicked" messaging shown to them — they just see the standard non-member view.
- Future/out of scope: long-term handling of kicked players' historical data, permanent block on re-joining. Don't design for these.  


## UI Layout

**Members list row** — add one ghost icon `Button` (three-dot `MoreHorizontal`) pinned to the far right of each row. No other changes to the row.

```
[ Avatar ]  Hunter Pfannenstiel          [ ··· ]
[ Avatar ]  Marcus Chen                  [ ··· ]
```

**Trigger — `DropdownMenu`**: tapping `···` opens a dropdown with a single `DropdownMenuGroup` containing one item, **"Remove from league"**, styled `text-destructive`. (Leaves room  
 for future member-level actions to stack here.)

**Confirmation — `AlertDialog`** (deliberately not `Dialog` — can't be dismissed by clicking outside, appropriate for an irreversible action):

- `AlertDialogTitle`: _"Remove [Name] from the league?"_ — name is load-bearing, forces commissioner to confront who they're removing
- `AlertDialogDescription`: exactly two facts, no more — _"They'll lose access immediately. Their history stays intact."_
- `AlertDialogFooter`: `AlertDialogCancel` (default variant, left) and `AlertDialogAction` (destructive variant, right, labeled "Remove")  


## Explicitly excluded from this flow

No reason field, no "notify player" toggle, no secondary/double confirmation. Three intentional taps total (open menu → open dialog → confirm) is the right ratio for an irreversible  
 action — don't add more friction or more steps.

## Components

- `DropdownMenu` — already installed in the project
- `AlertDialog` — not yet installed, needs `npx shadcn@latest add alert-dialog`
- Everything else (`Button`, `Avatar`) already in place  


That's the complete surface — the confirmation UX was the only open design question, and it's settled per above.
