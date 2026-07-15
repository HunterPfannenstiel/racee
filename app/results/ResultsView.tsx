"use client";

import { RaceSelector } from "@/components/prediction/RaceSelector";
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
};

export function ResultsView({
  races,
  selectedRaceId,
  onSelectRace,
  entries,
  stats,
  isLoading,
  currentUserId,
}: ResultsViewProps) {
  const podiumEntries = entries.filter((entry) => entry.rank <= 3);
  const listEntries = entries.filter((entry) => entry.rank > 3);

  return (
    <div className="flex flex-col gap-6">
      <RaceSelector races={races} selectedRaceId={selectedRaceId} onSelect={onSelectRace} />

      {isLoading ? (
        <ResultsSkeleton />
      ) : entries.length === 0 ? (
        <ResultsEmpty />
      ) : (
        <>
          <Podium entries={podiumEntries} currentUserId={currentUserId} />
          {listEntries.length > 0 && (
            <ResultsList entries={listEntries} currentUserId={currentUserId} />
          )}
          {stats && <StatsFooter stats={stats} />}
        </>
      )}
    </div>
  );
}
