"use client";

import { Card, CardHeader, CardContent, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PendingSection } from "./PendingSection";
import { MembersSection } from "./MembersSection";
import { usePlayersList } from "./hooks/usePlayersList";

type PlayersListProps = {
  leagueId: string;
};

export function PlayersList({ leagueId }: PlayersListProps) {
  const { pending, members, loading, error, accept, deny, remove, actionPending } =
    usePlayersList(leagueId);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading players...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Members
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          <MembersSection leagueId={leagueId} members={members} onRemove={remove} actionPending={actionPending} />
        </CardContent>
      </Card>

      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Pending
            </h2>
            <CardAction>
              <Badge variant="secondary">{pending.length}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="p-0">
            <PendingSection
              pending={pending}
              onAccept={accept}
              onDeny={deny}
              actionPending={actionPending}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
