"use client";

import { useState } from "react";
import {
  MOCK_CURRENT_USER_ID,
  MOCK_LEAGUE_NAME,
  MOCK_RACES,
  MOCK_RESULTS_BY_RACE,
  MOCK_STATS_BY_RACE,
} from "../mock-data";

// Defaults to the most recently scored race, mirroring autoSelectScoredRace in
// the real page (most recent race by date, sorted descending).
function mostRecentRaceId(): string {
  return [...MOCK_RACES].sort((a, b) => b.date.localeCompare(a.date))[0].id;
}

export function useMockResults() {
  const [selectedRaceId, setSelectedRaceId] = useState(mostRecentRaceId);
  const selectedRace = MOCK_RACES.find((race) => race.id === selectedRaceId);

  return {
    races: MOCK_RACES,
    selectedRaceId,
    onSelectRace: setSelectedRaceId,
    entries: MOCK_RESULTS_BY_RACE[selectedRaceId] ?? [],
    stats: MOCK_STATS_BY_RACE[selectedRaceId] ?? null,
    isLoading: false,
    currentUserId: MOCK_CURRENT_USER_ID,
    raceName: selectedRace?.title ?? "",
    leagueName: MOCK_LEAGUE_NAME,
  };
}
