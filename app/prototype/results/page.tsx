"use client";

import { PrototypeLayout } from "@/app/prototype/PrototypeLayout";
import { useMockResults } from "@/app/results/hooks/useMockResults";
import { Podium } from "@/app/results/Podium";
import { ResultsList } from "@/app/results/ResultsList";

function StaticResults() {
  const { entries, currentUserId } = useMockResults();
  const podiumEntries = entries.filter((entry) => entry.rank <= 3);
  const listEntries = entries.filter((entry) => entry.rank > 3);

  return (
    <div className="flex flex-col gap-6 p-4">
      <Podium entries={podiumEntries} currentUserId={currentUserId} />
      {listEntries.length > 0 && (
        <ResultsList entries={listEntries} currentUserId={currentUserId} />
      )}
    </div>
  );
}

export default function ResultsPrototype() {
  return (
    <PrototypeLayout feature="Results" assembled={<StaticResults />}>
      {null}
    </PrototypeLayout>
  );
}
