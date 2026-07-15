"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ORPCError } from "@orpc/client";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { orpc } from "@/lib/orpc/client";
import { CoCommissioner } from "./co-commissioner";

type ConnectedCoCommissionerProps = {
  leagueId: string;
};

export function ConnectedCoCommissioner({ leagueId }: ConnectedCoCommissionerProps) {
  const queryClient = useQueryClient();
  const input = { leagueId };

  const membersQuery = useQuery(orpc.leagues.members.list.queryOptions({ input }));

  const setRoleMutation = useMutation(
    orpc.leagues.members.setRole.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.leagues.members.list.key({ input }) });
      },
    }),
  );

  const { members, coCommissioners } = useMemo(() => {
    const all = membersQuery.data ?? [];
    return {
      members: all.filter((m) => m.role === "member"),
      coCommissioners: all.filter((m) => m.role === "co-commissioner"),
    };
  }, [membersQuery.data]);

  if (membersQuery.isPending) return <Spinner className="w-4 h-4" />;

  // Owner-only section: co-commissioners get FORBIDDEN from members.list and the
  // whole section stays hidden — same behavior as the legacy 401-hides-section path.
  if (membersQuery.isError) {
    const err = membersQuery.error;
    if (err instanceof ORPCError && err.code === "FORBIDDEN") return null;
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load members</AlertDescription>
      </Alert>
    );
  }

  return (
    <CoCommissioner
      members={members}
      coCommissioners={coCommissioners}
      onPromote={(id) => {
        setRoleMutation.mutate({ leagueId, userId: id, role: "co-commissioner" });
      }}
      onDemote={(id) => {
        setRoleMutation.mutate({ leagueId, userId: id, role: "member" });
      }}
    />
  );
}
