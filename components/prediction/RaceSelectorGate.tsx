"use client";

import { RaceSelector, type RaceSelectorProps } from "./RaceSelector";

type RaceSelectorGateProps = RaceSelectorProps & {
  // Explicit "the underlying query has resolved" signal, distinct from
  // `races` merely being an empty array. Callers that default an
  // unresolved query's data to `[]` (see app/results/hooks/useResults.ts)
  // make "still loading" indistinguishable from "loaded with genuinely
  // zero races" if this gate only looked at array length. Pass the query's
  // actual pending/loading state here.
  isReady: boolean;
};

// Mounts RaceSelector only once its data is actually ready; renders nothing
// until then (no skeleton, matching RaceSelector's own self-hide-to-null
// behavior for <=1 race).
//
// Why this exists: RaceSelector's scroll-into-view effect is intentionally
// mount-only (see the comment in RaceSelector.tsx) so that later selections
// don't yank scroll position. That means if RaceSelector mounts before its
// data has loaded -- e.g. with `races={[]}` and `selectedRaceId={null}`
// while a query is still in flight -- it never gets a second chance to
// scroll the real selection into view once the data (and a matching ref)
// show up. This wrapper centralizes the "don't mount me with not-yet-loaded
// data" gate in one reusable place, rather than leaving each caller to
// replicate it inline (see app/predict/page.tsx, which gets this right today
// via its own broader page-level placeholder, but that pattern isn't
// reusable as-is and is exactly how app/results/ResultsView.tsx got it
// wrong).
export function RaceSelectorGate({ isReady, ...raceSelectorProps }: RaceSelectorGateProps) {
  if (!isReady) return null;
  return <RaceSelector {...raceSelectorProps} />;
}
