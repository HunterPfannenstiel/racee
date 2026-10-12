"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { DrawnTrophy, TrophyIcon } from "@/components/trophies/AwardIcons";
import { resizeImageToDataUrl } from "@/components/avatar/resizeImage";
import { MEDAL_LABEL, MEDALS, type Medal } from "@/lib/medals";

/** Admin: replace the built-in gold/silver/bronze trophy art site-wide. */
export function TrophyArtCard() {
  const queryClient = useQueryClient();
  const artQuery = useQuery(orpc.history.trophyArt.queryOptions());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Medal | null>(null);
  const inputs = useRef<Partial<Record<Medal, HTMLInputElement | null>>>({});

  const mutation = useMutation(
    orpc.history.setTrophyArt.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.history.trophyArt.key() }),
      onError: (e) => setError(e instanceof Error ? e.message : "Couldn't save that picture."),
      onSettled: () => setBusy(null),
    }),
  );

  async function upload(tier: Medal, file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(tier);
    try {
      mutation.mutate({ tier, dataUrl: await resizeImageToDataUrl(file, 256, 0.9, "png") });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that image.");
      setBusy(null);
    } finally {
      const input = inputs.current[tier];
      if (input) input.value = "";
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trophy art</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Upload your own trophy pictures and they replace the built-in trophies everywhere. Square PNGs with a clear
          background look best.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {MEDALS.map((tier) => {
            const custom = !!artQuery.data?.[tier];
            return (
              <div key={tier} className="flex flex-col items-center gap-2 rounded-sm border border-border p-3">
                <TrophyIcon medal={tier} className="size-16" />
                <span className="text-xs font-semibold">{MEDAL_LABEL[tier]}</span>
                {custom && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    Built-in: <DrawnTrophy medal={tier} className="size-4" />
                  </span>
                )}
                <input
                  ref={(el) => { inputs.current[tier] = el; }}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => upload(tier, e.target.files?.[0])}
                />
                <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => inputs.current[tier]?.click()}>
                  {busy === tier && <Spinner className="w-3 h-3 mr-1" />}
                  Upload
                </Button>
                {custom && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy !== null}
                    onClick={() => {
                      setBusy(tier);
                      mutation.mutate({ tier, dataUrl: null });
                    }}
                  >
                    Use built-in
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
