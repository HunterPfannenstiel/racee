"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/ui/page-shell";
import { QueryError } from "@/components/ui/query-state";
import { Button } from "@/components/ui/button";
import { useUser } from "@/app/context/UserContext";
import { useLeague } from "@/app/context/LeagueContext";
import { orpc } from "@/lib/orpc/client";
import { useResults } from "./hooks/useResults";
import { ResultsView } from "./ResultsView";
import { CutscenePlayer, type CutscenePlayerHandle } from "./cutscene/CutscenePlayer";
import type { CutsceneData } from "./cutscene/beats";

export default function ResultsPage() {
  const { user } = useUser();
  const { activeLeagueId } = useLeague();
  const { error, onRetry, ...view } = useResults();
  const { races, selectedRaceId, entries, currentUserId, isLoading } = view;

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

  // CutscenePlayer is remounted (via `key`) on every race switch so its
  // internal rAF clock/progress can't bleed across races, but that remount
  // is async -- clear the locally-mirrored isPlaying flag synchronously so
  // the Play button never reflects the previous race's playback state.
  useEffect(() => {
    setIsPlaying(false);
  }, [selectedRaceId]);

  return (
    <PageShell title="Results">
      {!activeLeagueId ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">No leagues yet.</p>
      ) : error ? (
        <QueryError error={error} onRetry={onRetry} />
      ) : (
        <>
          <Button
            size="sm"
            onClick={() => playerRef.current?.play()}
            disabled={!canPlayReveal || isPlaying}
          >
            Play Reveal
          </Button>
          <ResultsView {...view} />
          <CutscenePlayer
            key={selectedRaceId}
            ref={playerRef}
            data={cutsceneData}
            onProgress={(state) => setIsPlaying(state.isPlaying)}
          />
        </>
      )}
    </PageShell>
  );
}
