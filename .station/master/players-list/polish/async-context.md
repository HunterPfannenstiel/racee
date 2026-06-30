❯ There's one async action in this feature: **`kick`** in `usePlayersList.ts` (around line 96).

When it fires:

- `actionPending` gains the member's `id` — already threaded down to `MemberRow` as `isRemovePending`
- `isRemovePending` is currently wired to `disabled` on the `AlertDialogAction` ("Remove" button), so the button goes inert while the request is in flight  


What's missing from that loading state:

- No visual feedback on the "Remove" button while pending (it just goes disabled with no spinner or label change)
- The `AlertDialog` stays open during the request — user gets no indication something is happening  


That's the only async path. Everything else (the dropdown, the dialog open/close) is synchronous local state.
