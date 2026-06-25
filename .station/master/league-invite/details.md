# League Invite — Feature Details

## Join Experience

### Signed in, not a member
Click the invite link → instantly join the league → land on homepage. The league appears in the sidebar automatically. No confirmation step, no interstitial page.

### Signed in, already a member
Same behavior as above — land on homepage, nothing changes. No special handling.

### Not signed in
Redirect to sign-in. The invite intent is preserved through the sign-in flow so the user auto-joins the league after authenticating — no need to click the link a second time. Implementation mechanics TBD.

## Commissioner Controls (Phase 0)

Commissioners and co-commissioners can:

- **Generate** the invite link
- **Deactivate** the link (kills it permanently)
- **Regenerate** a new link (old one stays dead)

No member removal in phase 0. Membership is one-way — once you're in, you're in.

## Membership Boundaries

- If you're not a member, the league does not exist to you. No read-only access, no visibility.
- The sidebar is the user-facing source of truth — if the league is there, you're in.

## Edge Cases

- **Dead/deactivated link**: Nothing happens. No error page, no messaging.
- **Duplicate join**: Already a member clicking the link is a no-op.
