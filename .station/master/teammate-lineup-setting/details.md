# Teammate Lineup Setting — Feature Details

## Summary

Allow players to set and submit lineups on behalf of teammates within their team. This covers scenarios where a teammate can't submit their own lineup (e.g., no cell service). A lineup submitted by a teammate is treated identically to one submitted by the player themselves.

## Teammate Selector

- Persistent element at the top of the predict page
- Always visible — no opt-in or mode switch required
- Defaults to the current player's own lineup on page load
- Arrow-based navigation (`< Player Name >`) to cycle through teammates on the same team
- Acts as a global context switch — everything on the page below reflects the selected player's lineup

## Editing Experience

- Identical to setting your own lineup — same UI, same actions, same submission flow
- Shows the selected teammate's existing picks (if any), so you can modify rather than start from scratch
- A visual indicator clearly communicates that you are editing on behalf of someone else to prevent accidental submissions on the wrong lineup

## Conflict Handling

- Last submit wins
- No locking mechanism, no owner-priority logic
- If two people edit the same lineup simultaneously, whichever submission comes in last is the one that sticks

## Visibility

- A small attribution line on the page: "Lineup set by: [Name]"
- No notifications or alerts sent to the player
- No functional difference between a self-submitted and teammate-submitted lineup
