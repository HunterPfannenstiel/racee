"use client";

import { InfoIcon } from "lucide-react";
import { RaceSelector } from "@/components/prediction/RaceSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  currentUserId: string | null;
  leagueId: string | null;
};

export function ResultsView({
  races,
  selectedRaceId,
  onSelectRace,
  entries,
  stats,
  isLoading,
  currentUserId,
  leagueId,
}: ResultsViewProps) {
  const podiumEntries = entries.filter((entry) => entry.rank <= 3);
  const listEntries = entries.filter((entry) => entry.rank > 3);
  const currentUserSubmitted = !currentUserId || entries.some((entry) => entry.userId === currentUserId);

  return (
    <div className="flex flex-col gap-6">
      <RaceSelector
        races={races}
        selectedRaceId={selectedRaceId}
        onSelect={onSelectRace}
        order="asc"
        autoScrollToSelected
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
        </>
      )}
    </div>
  );
}
