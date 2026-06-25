# League Invite

Client Feedback: We really need players to not join all leagues. Commissioners will need to be able to send links/invites to people to have them enter the league. Once the player clicks link , signs in, they will need a "accept league invite" button before they show up in the players for that league.

## Chosen Approach: Magic Link

One non-expiring magic link per league. The simplest possible invite mechanism.

### How It Works

- Each league has a single invite link
- Anyone with the link can join the league immediately
- No expiration, no member cap
- Unauthenticated users are sent to sign-in first, then re-use the link to join

### Commissioner Controls

- Commissioners and co-commissioners can deactivate/regenerate the link
- Deactivating kills the old link permanently — regenerating creates a fresh one

### Design Decisions

- Magic link over alternatives (invite codes, QR codes, in-app invites, join requests)
- One reusable link per league
- No expiration
- No auto-join after sign-up
- Deactivate = new link (old link stays dead)
