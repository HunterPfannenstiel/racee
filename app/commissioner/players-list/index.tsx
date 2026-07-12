"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardContent, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { orpc } from "@/lib/orpc/client";
import { PendingSection } from "./PendingSection";
import { MembersSection } from "./MembersSection";

type PlayersListProps = {
  leagueId: string;
};

export function PlayersList({ leagueId }: PlayersListProps) {
  const queryClient = useQueryClient();
  const input = { leagueId };

  const playersQuery = useQuery(orpc.leagues.players.list.queryOptions({ input }));

  const invalidatePlayers = () => {
    queryClient.invalidateQueries({ queryKey: orpc.leagues.players.list.key({ input }) });
  };
  const acceptMutation = useMutation(
    orpc.leagues.players.accept.mutationOptions({ onSuccess: invalidatePlayers }),
  );
  const denyMutation = useMutation(
    orpc.leagues.players.deny.mutationOptions({ onSuccess: invalidatePlayers }),
  );
  const removeMutation = useMutation(
    orpc.leagues.players.remove.mutationOptions({
      onSuccess: () => {
        // Removal also strips the user from their team and shrinks the member
        // roster, so the co-commissioner and team-management views must refetch.
        invalidatePlayers();
        queryClient.invalidateQueries({ queryKey: orpc.leagues.members.list.key({ input }) });
        queryClient.invalidateQueries({ queryKey: orpc.leagues.teams.roster.key({ input }) });
      },
    }),
  );

  if (playersQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Loading players...</p>;
  }

  if (playersQuery.isError) {
    return <p className="text-sm text-destructive">Failed to load players.</p>;
  }

  const { pending, members } = playersQuery.data;

  const actionPending = new Set<string>();
  for (const m of [acceptMutation, denyMutation, removeMutation]) {
    if (m.isPending && m.variables) actionPending.add(m.variables.userId);
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
          <MembersSection
            leagueId={leagueId}
            members={members}
            onRemove={(id) => removeMutation.mutate({ leagueId, userId: id })}
            actionPending={actionPending}
          />
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
              onAccept={(id) => acceptMutation.mutate({ leagueId, userId: id })}
              onDeny={(id) => denyMutation.mutate({ leagueId, userId: id })}
              actionPending={actionPending}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
