"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/ui/page-shell";
import { QueryError } from "@/components/ui/query-state";
import { Spinner } from "@/components/ui/spinner";
import { useUser } from "@/app/context/UserContext";
import { useLeague } from "@/app/context/LeagueContext";
import { orpc } from "@/lib/orpc/client";
import { useResults } from "./hooks/useResults";
import { ResultsView } from "./ResultsView";
import { RevealGate } from "./RevealGate";
import {
  CutscenePlayer,
  type CutscenePlayerHandle,
  type CutscenePlayerProgress,
} from "./cutscene/CutscenePlayer";
import type { CutsceneData } from "./cutscene/beats";

const revealedRacesKey = (userId: string) => `racee_revealed_races:${userId}`;

// Defensive: this is user-editable browser storage, so corrupt/stale JSON is
// a real possibility -- fall back to "nothing revealed yet" on any failure
// rather than throwing.
function readRevealedIds(userId: string | null): Set<string> {
  if (!userId || typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(revealedRacesKey(userId));
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

// No cap/pruning -- this grows by at most one id per race, ever, so unbounded
// growth is fine.
function writeRevealedId(userId: string, raceId: string) {
  const ids = readRevealedIds(userId);
  if (ids.has(raceId)) return;
  ids.add(raceId);
  try {
    localStorage.setItem(revealedRacesKey(userId), JSON.stringify([...ids]));
  } catch {
    // Best-effort persistence -- e.g. private-mode/quota errors shouldn't
    // break the page; the in-memory `revealed` state still drives this tab.
  }
}

export default function ResultsPage() {
  const { user } = useUser();
  const { activeLeagueId } = useLeague();
  const { error, onRetry, ...view } = useResults();
  const { races, selectedRaceId, entries, currentUserId, isLoading, isRacesLoading } = view;

  // True once, permanently (never flips back), the first time both loading
  // flags have been observed false simultaneously. Backs the full-page
  // first-load spinner below -- a single loading gate covering the whole
  // "auth + races" load, rather than the page's later states (no-league,
  // error, gate, results) each flashing partial UI in turn while data is
  // still arriving. Resolved synchronously during render -- the same
  // "adjust state during render" idiom as the `revealed`/`gateKey` logic
  // further down -- rather than a useEffect, so it takes effect the same
  // render loading finishes, not one tick later.
  const [hasCompletedFirstLoad, setHasCompletedFirstLoad] = useState(false);
  if (!hasCompletedFirstLoad && !isRacesLoading && !isLoading) {
    setHasCompletedFirstLoad(true);
  }

  const { data: leagues = [] } = useQuery(orpc.leagues.list.queryOptions({ enabled: !!user }));
  const leagueName = leagues.find((l) => l.id === activeLeagueId)?.name ?? "";
  const raceName = races.find((r) => r.id === selectedRaceId)?.title ?? "";

  const cutsceneData = useMemo<CutsceneData>(
    () => ({ entries, raceName, leagueName, currentUserId }),
    [entries, raceName, leagueName, currentUserId],
  );
  const playerRef = useRef<CutscenePlayerHandle>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const canPlayReveal = !isLoading && entries.length > 0;
  const playCutsceneDisabled = !canPlayReveal || isPlaying;

  // `races` (from useResults) is already filtered to graded (keySetAt !=
  // null) races and sorted newest-first, so the first entry is the league's
  // current most-recently-graded race -- the only race the reveal choice
  // screen should ever gate.
  const mostRecentRaceId = races[0]?.id ?? null;

  // Per-user record of race ids the viewer has already chosen to reveal
  // (either RevealGate button), persisted to localStorage so the choice
  // screen doesn't reappear on a later visit/session. `storageVersion` is
  // bumped on every write to force re-reading it -- avoids keeping a second,
  // driftable copy of the set in state.
  const [storageVersion, setStorageVersion] = useState(0);
  const revealedIds = useMemo(
    () => readRevealedIds(currentUserId),
    // storageVersion isn't read inside -- it's a cache-busting dependency so
    // this re-reads localStorage after markRevealed writes to it.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
    [currentUserId, storageVersion],
  );

  function markRevealed(raceId: string | null) {
    if (!currentUserId || !raceId) return;
    writeRevealedId(currentUserId, raceId);
    setStorageVersion((v) => v + 1);
  }

  // Visual-only: whether ResultsView is actually mounted for the current
  // race. Deliberately decoupled from `revealedIds`/storage -- see
  // handlePlayCutscene below, where the storage write must NOT itself flip
  // this (the cutscene overlay, not this flag, is what should reveal
  // results for that path).
  const [revealed, setRevealed] = useState(false);

  // Resolve the starting value of `revealed` for whichever race is current
  // -- on initial load (once races/user resolve) and on every manual race
  // switch: gate only the league's current most-recently-graded race, and
  // only when it isn't already in the persisted revealed set; any other
  // race renders ResultsView directly. Done synchronously during render
  // (React's "adjusting state when a prop changes" pattern -- mirrored via
  // state, not a ref, so it stays compiler-safe), keyed off both the
  // selected race and the most-recent-race id, rather than in a useEffect --
  // so the correct screen is chosen on the very render the data becomes
  // available, with no post-mount flash of the wrong screen. Skipped
  // entirely while no race is selected yet (still loading) -- harmless,
  // since the render below also keeps RevealGate off-screen for the same
  // span (`isRacesLoading`), so `revealed`'s stale value here is never
  // actually shown.
  const gateKey = `${selectedRaceId ?? ""}|${mostRecentRaceId ?? ""}`;
  const [prevGateKey, setPrevGateKey] = useState("");
  if (selectedRaceId && gateKey !== prevGateKey) {
    setPrevGateKey(gateKey);
    const isGateRace = selectedRaceId === mostRecentRaceId && !revealedIds.has(selectedRaceId);
    const nextRevealed = !isGateRace;
    if (nextRevealed !== revealed) setRevealed(nextRevealed);
  }

  const handleShowResults = () => {
    markRevealed(selectedRaceId);
    setRevealed(true);
  };

  // Holds the pending "defer the reveal" timeout id -- see
  // handlePlayCutscene below.
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The visual reveal is now driven by the click itself (not by the
  // cutscene's own completion signal -- see handleCutsceneProgress below),
  // but still deferred a tick rather than flipped synchronously inline:
  // CutscenePlayer's `play()` (via playerRef) sets its overlay `visible`
  // true in the same commit, and mounting ResultsView in that same
  // tick/commit as the overlay's own fade-in starting competed for the same
  // frame and read as a flicker. A fresh-tick timeout lets that first frame
  // commit on its own before ResultsView mounts underneath it.
  const handlePlayCutscene = () => {
    markRevealed(selectedRaceId);
    playerRef.current?.play();
    if (revealTimeoutRef.current !== null) clearTimeout(revealTimeoutRef.current);
    revealTimeoutRef.current = setTimeout(() => {
      revealTimeoutRef.current = null;
      setRevealed(true);
    }, 1000);
  };

  // CutscenePlayer is remounted (via `key`) on every race switch so its
  // internal rAF clock/progress can't bleed across races, but that remount
  // is async -- clear the locally-mirrored isPlaying flag synchronously so
  // the Play button never reflects the previous race's playback state. Also
  // clear any pending deferred reveal (see handlePlayCutscene) so a stale
  // timeout from the previous race can't fire `setRevealed` after the user's
  // switched away from the race that timeout was meant for.
  useEffect(() => {
    setIsPlaying(false);
    return () => {
      if (revealTimeoutRef.current !== null) {
        clearTimeout(revealTimeoutRef.current);
        revealTimeoutRef.current = null;
      }
    };
  }, [selectedRaceId]);

  // `revealed` is no longer driven by cutscene completion (see
  // handlePlayCutscene above) -- this only mirrors live playback state for
  // the disabled-button treatment.
  const handleCutsceneProgress = (state: CutscenePlayerProgress) => {
    setIsPlaying(state.isPlaying);
  };

  // First load only: a blank, centered spinner -- no header content, race
  // selector, buttons, or skeleton sections -- while `hasCompletedFirstLoad`
  // is still false. Once it flips true (permanently), this is bypassed for
  // the rest of the page's lifetime; subsequent race switches are handled
  // entirely by ResultsView's own internal skeleton, unchanged.
  if (!hasCompletedFirstLoad) {
    return (
      <PageShell title="Results">
        <div className="flex justify-center pt-8">
          <Spinner />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Results">
      {!activeLeagueId ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">No leagues yet.</p>
      ) : error ? (
        <QueryError error={error} onRetry={onRetry} />
      ) : (
        <>
          {/* `raceName` (and the gate-vs-results decision itself) depends on
              `races`, which isn't guaranteed resolved until `isRacesLoading`
              is false -- render ResultsView (which shows its own loading
              skeleton while `isLoading`/`isRacesLoading` is true) instead of
              RevealGate until then, so RevealGate never mounts with a
              blank/not-yet-known race name. */}
          {revealed || isRacesLoading ? (
            <ResultsView
              {...view}
              leagueId={activeLeagueId}
              onPlayCutscene={handlePlayCutscene}
              playCutsceneDisabled={playCutsceneDisabled}
            />
          ) : (
            <RevealGate
              onPlayCutscene={handlePlayCutscene}
              onShowResults={handleShowResults}
              disabled={playCutsceneDisabled}
              raceName={raceName}
            />
          )}
          <CutscenePlayer
            key={selectedRaceId}
            ref={playerRef}
            data={cutsceneData}
            onProgress={handleCutsceneProgress}
          />
        </>
      )}
    </PageShell>
  );
}
