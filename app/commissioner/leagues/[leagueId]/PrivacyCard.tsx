"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

/** Commissioner switch: make the league private so outsiders can't see inside it. */
export function PrivacyCard({ leagueId }: { leagueId: string }) {
  const queryClient = useQueryClient();
  const historyQuery = useQuery(orpc.history.get.queryOptions({ input: { leagueId } }));
  const mutation = useMutation(
    orpc.history.setPrivate.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.history.key() }),
    }),
  );
  const isPrivate = historyQuery.data?.isPrivate ?? false;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Privacy</h2>
      </CardHeader>
      <CardContent className="space-y-2">
        <label className="flex items-center gap-3 text-sm">
          <span className="flex-1 font-semibold">Private league</span>
          <Switch
            checked={isPrivate}
            disabled={!historyQuery.data || mutation.isPending}
            onCheckedChange={(checked) => mutation.mutate({ leagueId, isPrivate: checked })}
          />
        </label>
        <p className="text-xs text-muted-foreground">
          {isPrivate
            ? "No one outside the league can see what happens inside it. On players' profiles, outsiders only see this league's name, trophies and medal counts — no points, races or picks."
            : "Players' profiles show this league's results to anyone. Turn this on to keep everything inside the league."}
        </p>
        {mutation.isError && <p className="text-xs text-destructive">Couldn&apos;t save. Try again.</p>}
      </CardContent>
    </Card>
  );
}
