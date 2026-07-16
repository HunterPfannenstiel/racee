# Phase B payload generation summary

Pure transform: Phase A extraction + human-reviewed resolution manifest -> `PredictionMutationSchema` payloads. No blob writes, no app code calls, no network calls. A separate load script consumes these.

## Australia
- Generated: 24
- Skipped: 0
- Flagged (payload still generated):
  - **DUPLICATE_DRIVER_IN_PREDICTION** — "Chris Michels" has the same driver ranked more than once — carried through as-extracted per source data, not corrected. A real driver was crowded out of this ranking.
  - **PARTIAL_PROP_PICKS_OMITTED** — "Tyler Fox" answered 6/7 props for Australia (the real app requires all 7 or none) — propPicks omitted from this payload, racerIds still included. Missing: [wrecker]. Unresolved: [none].
  - **DUPLICATE_DRIVER_IN_PREDICTION** — "Skipper Bertrand" has the same driver ranked more than once — carried through as-extracted per source data, not corrected. A real driver was crowded out of this ranking.
  - **DUPLICATE_DRIVER_IN_PREDICTION** — "Matt Bishop" has the same driver ranked more than once — carried through as-extracted per source data, not corrected. A real driver was crowded out of this ranking.
  - **DUPLICATE_DRIVER_IN_PREDICTION** — "Daniel Kilpadikar" has the same driver ranked more than once — carried through as-extracted per source data, not corrected. A real driver was crowded out of this ranking.
  - **DUPLICATE_DRIVER_IN_PREDICTION** — "Zach Duck" has the same driver ranked more than once — carried through as-extracted per source data, not corrected. A real driver was crowded out of this ranking.
  - **UNEXPECTED_RANKING_LENGTH** — Expected 22 ranked picks, got 21 for "Sarah Duck" (team "Scooty Puff Jr")

## China
- Generated: 22
- Skipped: 2
  - **EMPTY_PREDICTION** — Player "Angelia Clark" (team "Mile High") has zero picks in the source Weekly Lineups — no payload generated.
  - **EMPTY_PREDICTION** — Player "Jacob Junker" (team "Mile High") has zero picks in the source Weekly Lineups — no payload generated.
- Flagged (payload still generated):
  - **PARTIAL_PROP_PICKS_OMITTED** — "Tyler Fox" answered 6/7 props for China (the real app requires all 7 or none) — propPicks omitted from this payload, racerIds still included. Missing: [wrecker]. Unresolved: [none].
  - **DUPLICATE_DRIVER_IN_PREDICTION** — "Ryan Sherlock" has the same driver ranked more than once — carried through as-extracted per source data, not corrected. A real driver was crowded out of this ranking.
  - **DUPLICATE_DRIVER_IN_PREDICTION** — "Zach Duck" has the same driver ranked more than once — carried through as-extracted per source data, not corrected. A real driver was crowded out of this ranking.

## Japan
- Generated: 23
- Skipped: 1
  - **EMPTY_PREDICTION** — Player "Daniel Kilpadikar" (team "Kildaullac Motorshports") has zero picks in the source Weekly Lineups — no payload generated.
- Flagged (payload still generated):
  - **PARTIAL_PROP_PICKS_OMITTED** — "Tyler Fox" answered 6/7 props for Japan (the real app requires all 7 or none) — propPicks omitted from this payload, racerIds still included. Missing: [wrecker]. Unresolved: [none].
  - **DUPLICATE_DRIVER_IN_PREDICTION** — "Zach Duck" has the same driver ranked more than once — carried through as-extracted per source data, not corrected. A real driver was crowded out of this ranking.

## Miami
- Generated: 24
- Skipped: 0
- Flagged (payload still generated):
  - **DUPLICATE_DRIVER_IN_PREDICTION** — "Johnson Miller" has the same driver ranked more than once — carried through as-extracted per source data, not corrected. A real driver was crowded out of this ranking.
  - **PARTIAL_PROP_PICKS_OMITTED** — "Tyler Fox" answered 6/7 props for Miami (the real app requires all 7 or none) — propPicks omitted from this payload, racerIds still included. Missing: [wrecker]. Unresolved: [none].
  - **DUPLICATE_DRIVER_IN_PREDICTION** — "Russell Henderson" has the same driver ranked more than once — carried through as-extracted per source data, not corrected. A real driver was crowded out of this ranking.

## Canada
- Generated: 24
- Skipped: 0
- Flagged (payload still generated):
  - **PARTIAL_PROP_PICKS_OMITTED** — "Tyler Fox" answered 6/7 props for Canada (the real app requires all 7 or none) — propPicks omitted from this payload, racerIds still included. Missing: [wrecker]. Unresolved: [none].
  - **PARTIAL_PROP_PICKS_OMITTED** — "Antonio LaMonica" answered 6/7 props for Canada (the real app requires all 7 or none) — propPicks omitted from this payload, racerIds still included. Missing: [wrecker]. Unresolved: [none].
  - **DUPLICATE_DRIVER_IN_PREDICTION** — "Ryan Sherlock" has the same driver ranked more than once — carried through as-extracted per source data, not corrected. A real driver was crowded out of this ranking.
  - **DUPLICATE_DRIVER_IN_PREDICTION** — "Sarah Duck" has the same driver ranked more than once — carried through as-extracted per source data, not corrected. A real driver was crowded out of this ranking.

## Totals
- Payloads generated across all races: 117
- Skipped across all races: 3

## Not done here (by design)
- No writes to blob storage, no `PredictionService` calls, no network calls.
- Bahrain/Saudi Arabia are still out of scope — no Excel source files yet.
- Every payload was validated against the real `PredictionMutationSchema` from `lib/schemas.ts` before being written.