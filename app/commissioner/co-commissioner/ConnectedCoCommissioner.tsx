"use client";

import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CoCommissioner } from "./co-commissioner";
import { useCoCommissioner } from "./hooks/useCoCommissioner";

type ConnectedCoCommissionerProps = {
  leagueId: string;
};

export function ConnectedCoCommissioner({ leagueId }: ConnectedCoCommissionerProps) {
  const { members, coCommissioners, loading, hidden, error, promote, demote } =
    useCoCommissioner(leagueId);

  if (loading) return <Spinner className="w-4 h-4" />;
  if (hidden) return null;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <CoCommissioner
      members={members}
      coCommissioners={coCommissioners}
      onPromote={promote}
      onDemote={demote}
    />
  );
}
