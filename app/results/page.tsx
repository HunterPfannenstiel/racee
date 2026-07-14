"use client";

import { PageShell } from "@/components/ui/page-shell";
import { QueryError } from "@/components/ui/query-state";
import { useLeague } from "@/app/context/LeagueContext";
import { useResults } from "./hooks/useResults";
import { ResultsView } from "./ResultsView";

export default function ResultsPage() {
  const { activeLeagueId } = useLeague();
  const { error, onRetry, ...view } = useResults();

  return (
    <PageShell title="Results">
      {!activeLeagueId ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">No leagues yet.</p>
      ) : error ? (
        <QueryError error={error} onRetry={onRetry} />
      ) : (
        <ResultsView {...view} />
      )}
    </PageShell>
  );
}
