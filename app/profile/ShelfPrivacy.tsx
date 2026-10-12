"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpIcon, StarIcon } from "lucide-react";
import { orpc } from "@/lib/orpc/client";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { TrophyIcon } from "@/components/trophies/AwardIcons";

const MAX_FRONT = 6;

/**
 * Trophy shelf settings: pick (and order) the trophies on the front shelf, and
 * keep leagues or trophies off your public profile. Hidden leagues still show to
 * people in that league.
 */
export function ShelfPrivacy({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const shelfQuery = useQuery(orpc.history.shelf.queryOptions({ input: { userId } }));
  const save = useMutation(
    orpc.history.setHidden.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.history.shelf.key() }),
    }),
  );

  const leagues = shelfQuery.data?.leagues ?? [];
  if (leagues.length === 0) return null;

  const front = shelfQuery.data?.featuredTrophyKeys ?? [];
  const trophies = leagues.flatMap((l) =>
    l.seasons.filter((s) => s.trophy).map((s) => ({ ...s, leagueName: l.name })),
  );
  const byKey = new Map(trophies.map((t) => [t.trophyKey, t]));
  const setFront = (keys: string[]) => save.mutate({ featuredTrophyKeys: keys });
  const toggleFront = (key: string) =>
    setFront(front.includes(key) ? front.filter((k) => k !== key) : [...front, key]);
  const moveUp = (key: string) => {
    const i = front.indexOf(key);
    if (i <= 0) return;
    const next = [...front];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setFront(next);
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trophy shelf</h2>
      </CardHeader>
      <CardContent className="space-y-6">
        {trophies.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Front shelf</p>
            <p className="text-xs text-muted-foreground">
              Star up to {MAX_FRONT} trophies to show off at the top of your profile. Pick none and your best ones show
              automatically.
            </p>
            {front.length > 0 && (
              <ol className="space-y-1">
                {front.map((key, i) => {
                  const t = byKey.get(key);
                  if (!t) return null;
                  return (
                    <li key={key} className="flex items-center gap-2 text-sm">
                      <span className="w-4 text-xs text-muted-foreground">{i + 1}</span>
                      {t.trophy && <TrophyIcon medal={t.trophy} className="size-5" />}
                      <span className="flex-1 truncate">
                        {t.label} · {t.leagueName}
                      </span>
                      <button
                        type="button"
                        onClick={() => moveUp(key)}
                        disabled={i === 0 || save.isPending}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label="Move left on the shelf"
                      >
                        <ArrowUpIcon className="size-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Who can see it</p>
          <p className="text-xs text-muted-foreground">
            Turn off anything you don&apos;t want other players to see on your profile. A hidden league still shows to
            people in that league.
          </p>
          {leagues.map((l) => (
            <div key={l.leagueId} className="space-y-2">
              <label className="flex items-center gap-3 text-sm">
                <span className="flex-1 font-semibold">{l.name}</span>
                <span className="text-xs text-muted-foreground">{l.hidden ? "Hidden" : "Shown"}</span>
                <Switch
                  checked={!l.hidden}
                  disabled={save.isPending}
                  onCheckedChange={(shown) => save.mutate({ leagueId: l.leagueId, hidden: !shown })}
                />
              </label>
              {l.seasons
                .filter((s) => s.trophy)
                .map((s) => {
                  const starred = front.includes(s.trophyKey);
                  return (
                    <div key={s.trophyKey} className="flex items-center gap-3 pl-4 text-sm">
                      {s.trophy && <TrophyIcon medal={s.trophy} className="size-4" />}
                      <span className="flex-1">{s.label} trophy</span>
                      <button
                        type="button"
                        onClick={() => toggleFront(s.trophyKey)}
                        disabled={save.isPending || (!starred && front.length >= MAX_FRONT)}
                        className="p-1 disabled:opacity-30"
                        aria-label={starred ? "Take off the front shelf" : "Put on the front shelf"}
                        aria-pressed={starred}
                      >
                        <StarIcon className={cn("size-4", starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                      </button>
                      <span className="w-12 text-right text-xs text-muted-foreground">{s.trophyHidden ? "Hidden" : "Shown"}</span>
                      <Switch
                        size="sm"
                        checked={!s.trophyHidden}
                        disabled={save.isPending}
                        onCheckedChange={(shown) => save.mutate({ trophyKey: s.trophyKey, hidden: !shown })}
                      />
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
