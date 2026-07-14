"use client";

import { PrototypeLayout, PrototypeSection } from "@/app/prototype/PrototypeLayout";
import { ResultsView } from "@/app/results/ResultsView";
import { Podium } from "@/app/results/Podium";
import { ResultsList } from "@/app/results/ResultsList";
import { StatsFooter } from "@/app/results/StatsFooter";
import { ResultsSkeleton } from "@/app/results/ResultsSkeleton";
import { ResultsEmpty } from "@/app/results/ResultsEmpty";
import { useMockResults } from "@/app/results/hooks/useMockResults";
import type { StatsData } from "@/app/results/types";

const PODIUM_ENTRIES = [
  { userId: "u-2", name: "Lando N.", total: 40, rank: 1, color: "#E8002D" },
  { userId: "u-1", name: "Max V.", total: 36, rank: 2, color: "#FF8000" },
  { userId: "u-4", name: "Hunter P.", total: 28, rank: 3, color: "#3671C6" },
];

const STATS: StatsData = {
  bestPropBet: { value: "92%", sublabel: "Safety Car Deployed" },
  averageScore: { value: "34.7" },
  highestScore: { value: "40", sublabel: "Lando N." },
  lowestScore: { value: "28", sublabel: "Hunter P." },
};

const STATS_LONG_SUBLABELS: StatsData = {
  bestPropBet: { value: "78%", sublabel: "First Retirement Before Lap 10" },
  averageScore: { value: "25.3" },
  highestScore: { value: "43", sublabel: "Maximilian Verstappen-Something" },
  lowestScore: { value: "9", sublabel: "Lewis Hamilton-Extended-Name" },
};

const LIST_ENTRIES = [
  { userId: "u-4", name: "Hunter P.", total: 22, rank: 4, color: "#3671C6" },
  { userId: "u-5", name: "Carlos S.", total: 19, rank: 5, color: "#229971" },
  { userId: "u-6", name: "George R.", total: 15, rank: 6, color: "#FF87BC" },
  { userId: "u-7", name: "Lewis H.", total: 9, rank: 7, color: "#64C4FF" },
];

function AssembledResults() {
  const mock = useMockResults();
  return <ResultsView {...mock} />;
}

export default function ResultsPrototype() {
  return (
    <PrototypeLayout
      feature="Results"
      assembled={
        <div className="p-4">
          <AssembledResults />
        </div>
      }
    >
      <PrototypeSection name="Podium — Current Player on Podium">
        <Podium entries={PODIUM_ENTRIES} currentUserId="u-4" />
      </PrototypeSection>

      <PrototypeSection name="Results List — Current Player 4th or Lower">
        <ResultsList entries={LIST_ENTRIES} currentUserId="u-4" />
      </PrototypeSection>

      <PrototypeSection name="Stats Footer">
        <StatsFooter stats={STATS} />
      </PrototypeSection>

      <PrototypeSection name="Stats Footer — Long Sublabel Truncation">
        <StatsFooter stats={STATS_LONG_SUBLABELS} />
      </PrototypeSection>

      <PrototypeSection name="Loading">
        <ResultsSkeleton />
      </PrototypeSection>

      <PrototypeSection name="Empty (No Scored Results)">
        <ResultsEmpty />
      </PrototypeSection>
    </PrototypeLayout>
  );
}
