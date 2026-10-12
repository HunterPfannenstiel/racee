"use client";

import { InfoIcon, Play } from "lucide-react";
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
}: ResultsViewProps) {
  const podiumEntries = entries.filter((entry) => entry.rank <= 3);
  const listEntries = entries.filter((entry) => entry.rank > 3);
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

      {isLoading ? (
        <ResultsSkeleton />
      ) : entries.length === 0 ? (
        <ResultsEmpty />
      ) : (
        <>
          {!currentUserSubmitted && (
            <Alert className="mx-4">
              <InfoIcon />
              <AlertDescription>You didn&apos;t submit a prediction for this race.</AlertDescription>
            </Alert>
          )}
          <Podium
            entries={podiumEntries}
            currentUserId={currentUserId}
            leagueId={leagueId}
            raceId={selectedRaceId}
          />
          {listEntries.length > 0 && (
            <ResultsList
              entries={listEntries}
              currentUserId={currentUserId}
              leagueId={leagueId}
              raceId={selectedRaceId}
            />
          )}
          {stats && <StatsFooter stats={stats} />}
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
