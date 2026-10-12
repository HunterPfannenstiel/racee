"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { TrophyIcon } from "@/components/trophies/AwardIcons";

/**
 * Lets a player keep leagues and trophies off their public trophy shelf.
 * Hidden leagues still show to that league's own members.
 */
export function ShelfPrivacy({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const shelfQuery = useQuery(orpc.history.shelf.queryOptions({ input: { userId } }));
  const setHidden = useMutation(
    orpc.history.setHidden.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.history.shelf.key() }),
    }),
  );

  const leagues = shelfQuery.data?.leagues ?? [];
  if (leagues.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trophy shelf privacy</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Turn off anything you don&apos;t want other players to see on your profile. A hidden league still shows to people
          in that league.
        </p>
        {leagues.map((l) => (
          <div key={l.leagueId} className="space-y-2">
            <label className="flex items-center gap-3 text-sm">
              <span className="flex-1 font-semibold">{l.name}</span>
              <span className="text-xs text-muted-foreground">{l.hidden ? "Hidden" : "Shown"}</span>
              <Switch
                checked={!l.hidden}
                disabled={setHidden.isPending}
                onCheckedChange={(shown) => setHidden.mutate({ leagueId: l.leagueId, hidden: !shown })}
              />
            </label>
            {l.seasons
              .filter((s) => s.status !== "in_progress" && s.rank !== null && s.rank <= 3)
              .map((s) => (
                <label key={s.trophyKey} className="flex items-center gap-3 pl-4 text-sm">
                  {s.trophy && <TrophyIcon medal={s.trophy} className="size-4" />}
                  <span className="flex-1">{s.label} trophy</span>
                  <span className="text-xs text-muted-foreground">{s.trophyHidden ? "Hidden" : "Shown"}</span>
                  <Switch
                    size="sm"
                    checked={!s.trophyHidden}
                    disabled={setHidden.isPending}
                    onCheckedChange={(shown) => setHidden.mutate({ trophyKey: s.trophyKey, hidden: !shown })}
                  />
                </label>
              ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
