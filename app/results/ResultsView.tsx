"use client";

import { useState } from "react";
import { InfoIcon, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { RaceSelectorGate } from "@/components/prediction/RaceSelectorGate";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Podium } from "./Podium";
import { ResultsList } from "./ResultsList";
import { StatsFooter } from "./StatsFooter";
import { ResultsSkeleton } from "./ResultsSkeleton";
import { ResultsEmpty } from "./ResultsEmpty";
import type { ResultsRowData, StatsData } from "./types";

type ResultsViewRace = {
  id: string;
  title: string;
  date: string;
};

type ResultsViewProps = {
  races: ResultsViewRace[];
  selectedRaceId: string | null;
  onSelectRace: (raceId: string) => void;
  entries: ResultsRowData[];
  stats: StatsData | null;
  isLoading: boolean;
  isRacesLoading: boolean;
  currentUserId: string | null;
  leagueId: string | null;
  onPlayCutscene: () => void;
  playCutsceneDisabled?: boolean;
  /** Present only when the league uses teams: plays the constructors reveal. */
  onPlayConstructors?: () => void;
  playConstructorsDisabled?: boolean;
  /** Team results for this race (leagues with team scoring); shows a Constructors tab. */
  constructorEntries?: ResultsRowData[] | null;
  viewerTeamId?: string | null;
};

export function ResultsView({
  races,
  selectedRaceId,
  onSelectRace,
  entries,
  stats,
  isLoading,
  isRacesLoading,
  currentUserId,
  leagueId,
  onPlayCutscene,
  playCutsceneDisabled,
  onPlayConstructors,
  playConstructorsDisabled,
  constructorEntries,
  viewerTeamId = null,
}: ResultsViewProps) {
  const [tab, setTab] = useState<"drivers" | "constructors">("drivers");
  const hasConstructors = !!constructorEntries && constructorEntries.length > 0;
  const showTeams = hasConstructors && tab === "constructors";
  const shown = showTeams ? constructorEntries! : entries;
  const shownViewerId = showTeams ? viewerTeamId : currentUserId;
  const podiumEntries = shown.filter((entry) => entry.rank <= 3);
  const listEntries = shown.filter((entry) => entry.rank > 3);
  const currentUserSubmitted = !currentUserId || entries.some((entry) => entry.userId === currentUserId);

  return (
    <div className="flex flex-col gap-6">
      <RaceSelectorGate
        races={races}
        selectedRaceId={selectedRaceId}
        onSelect={onSelectRace}
        order="asc"
        autoScrollToSelected
        isReady={!isRacesLoading}
      />

      {hasConstructors && (
        <div className="flex gap-1 px-4">
          {(["drivers", "constructors"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={cn(
                "min-h-[40px] rounded-md px-4 font-mono text-sm font-semibold uppercase tracking-[0.06em] transition-colors",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <ResultsSkeleton />
      ) : entries.length === 0 ? (
        <ResultsEmpty />
      ) : (
        <>
          {!currentUserSubmitted && !showTeams && (
            <Alert className="mx-4">
              <InfoIcon />
              <AlertDescription>You didn&apos;t submit a prediction for this race.</AlertDescription>
            </Alert>
          )}
          <Podium
            entries={podiumEntries}
            currentUserId={shownViewerId}
            mode={showTeams ? "constructors" : "drivers"}
            leagueId={leagueId}
            raceId={selectedRaceId}
          />
          {listEntries.length > 0 && (
            <ResultsList
              entries={listEntries}
              currentUserId={shownViewerId}
              mode={showTeams ? "constructors" : "drivers"}
              leagueId={leagueId}
              raceId={selectedRaceId}
            />
          )}
          {stats && !showTeams && <StatsFooter stats={stats} />}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" className="gap-1.5" onClick={onPlayCutscene} disabled={playCutsceneDisabled}>
              <Play className="size-3.5" />
              Drivers reveal
            </Button>
            {onPlayConstructors && (
              <Button size="sm" className="gap-1.5" onClick={onPlayConstructors} disabled={playConstructorsDisabled}>
                <Play className="size-3.5" />
                Constructors reveal
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
