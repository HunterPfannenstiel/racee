# Human-confirmed decisions

Manual sign-off log for judgment calls flagged in `MANIFEST_SUMMARY.md`. These are not
re-derived by any script — they're recorded here as the audit trail for why the
resolution tables in this directory were accepted as-is, and Phase B payload
generation treats them as settled (not re-litigated).

## 1. "Sarah Duck" → Sarah Gile (`ye2lsDm8gCH2aiKp9497MiQfWmQJKaoN`)
**Confirmed by Hunter Pfannenstiel, 2026-07-11.** Same person despite the differing
last name and email in the spreadsheet vs. the real auth account. Accept the
elimination-based match in `player-names.json` as correct.

## 2. "Dan 1" (`mrhockeyforlife510@gmail.com`) not on any team in this league
**Confirmed by Hunter Pfannenstiel, 2026-07-11.** Dan 1 was removed from the league.
This is why the "Dan 1 vs Dan 2" ambiguity raised earlier didn't actually surface in
the manifest — Dan 1 is not a candidate for any team, so "Dan 2" (Daniel Kilpadikar)
resolving unambiguously on Kildaullac Motorshports is correct and expected, not a
coincidence to double check.

## Not separately confirmed, but not blocking
The four other email-mismatch-but-unambiguous player matches (Tony DeSha, Russell
Henderson, Daniel Kilpadikar's stale contact email, Austin Teders) were left as
lower-priority/informational in `MANIFEST_SUMMARY.md` and were not individually
re-confirmed — they're accepted on the strength of exact/near-exact name match plus
a 2-person elimination pool, per the same 2026-07-11 conversation.
