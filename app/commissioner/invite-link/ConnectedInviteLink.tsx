"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { orpc } from "@/lib/orpc/client";
import { InviteLink } from "./InviteLink";

type ConnectedInviteLinkProps = {
  leagueId: string;
};

function buildLink(token: string): string {
  return `${window.location.origin}/join/${token}`;
}

export function ConnectedInviteLink({ leagueId }: ConnectedInviteLinkProps) {
  const queryClient = useQueryClient();
  const input = { leagueId };
  const [confirmation, setConfirmation] = useState<"deactivate" | "regenerate" | null>(null);

  const inviteQuery = useQuery(orpc.leagues.invite.get.queryOptions({ input }));

  const invalidateInvite = () => {
    queryClient.invalidateQueries({ queryKey: orpc.leagues.invite.get.key({ input }) });
  };
  const generateMutation = useMutation(
    orpc.leagues.invite.generate.mutationOptions({
      onSuccess: () => {
        invalidateInvite();
        setConfirmation(null);
      },
    }),
  );
  const deactivateMutation = useMutation(
    orpc.leagues.invite.deactivate.mutationOptions({
      onSuccess: () => {
        invalidateInvite();
        setConfirmation(null);
      },
    }),
  );

  if (inviteQuery.isPending) return <Spinner className="w-4 h-4" />;

  const error =
    inviteQuery.isError || generateMutation.isError || deactivateMutation.isError;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load invite link</AlertDescription>
      </Alert>
    );
  }

  const token = inviteQuery.data.token;

  return (
    <InviteLink
      link={token ? buildLink(token) : null}
      confirmation={confirmation}
      onGenerate={() => generateMutation.mutate(input)}
      onDeactivate={() => deactivateMutation.mutate(input)}
      onRegenerate={() => generateMutation.mutate(input)}
      onConfirmationChange={setConfirmation}
    />
  );
}
