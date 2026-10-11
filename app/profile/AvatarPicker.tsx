"use client";

import { useRef, useState } from "react";
import { Camera, Check, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { cn } from "@/lib/utils";
import { AVATAR_PRESET_IDS, parseAvatar, type AvatarPresetId } from "@/lib/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { PlayerAvatar } from "@/components/avatar/PlayerAvatar";
import { AVATAR_PRESETS, PresetGlyph } from "@/components/avatar/presets";
import { resizeImageToDataUrl } from "@/components/avatar/resizeImage";

type Props = {
  userId: string;
  name: string;
  image: string | null;
};

/** Profile picture: upload a photo or pick one of the built-in icons. Seen by everyone in your leagues. */
export function AvatarPicker({ userId, name, image }: Props) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  function onSaved() {
    setError(null);
    queryClient.invalidateQueries({ queryKey: orpc.me.get.key() });
    // Every league's avatar list includes this user.
    queryClient.invalidateQueries({ queryKey: orpc.leagues.avatars.key() });
  }
  function onFailed(e: unknown) {
    setError(e instanceof Error && e.message ? e.message : "Couldn't save your picture. Try again.");
  }

  const presetMutation = useMutation(orpc.me.setAvatarPreset.mutationOptions({ onSuccess: onSaved, onError: onFailed }));
  const uploadMutation = useMutation(orpc.me.uploadAvatar.mutationOptions({ onSuccess: onSaved, onError: onFailed }));
  const busy = processing || presetMutation.isPending || uploadMutation.isPending;
  const parsedCurrent = parseAvatar(image, userId);
  const currentPreset = parsedCurrent.kind === "preset" ? parsedCurrent.id : null;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setProcessing(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      uploadMutation.mutate({ dataUrl });
    } catch (e) {
      onFailed(e);
    } finally {
      setProcessing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Profile Picture</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <PlayerAvatar userId={userId} name={name} image={image} size="xl" />
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
              {processing || uploadMutation.isPending ? <Spinner className="w-3 h-3 mr-1" /> : <Camera className="size-3.5 mr-1" />}
              Upload photo
            </Button>
            {parseAvatar(image, userId).kind !== "none" && (
              <Button variant="ghost" size="sm" onClick={() => presetMutation.mutate({ presetId: null })} disabled={busy}>
                <X className="size-3.5 mr-1" />
                Remove
              </Button>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Or pick an icon</p>
          <div className="grid grid-cols-5 gap-2">
            {AVATAR_PRESET_IDS.map((id: AvatarPresetId) => {
              const preset = AVATAR_PRESETS[id];
              const selected = currentPreset === id;
              return (
                <button
                  key={id}
                  type="button"
                  title={preset.label}
                  aria-label={preset.label}
                  aria-pressed={selected}
                  disabled={busy}
                  onClick={() => presetMutation.mutate({ presetId: id })}
                  className={cn(
                    "relative aspect-square w-full max-w-14 justify-self-center rounded-full flex items-center justify-center transition-transform",
                    "hover:scale-105 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                  style={{ backgroundColor: preset.bg }}
                >
                  <PresetGlyph preset={preset} px={26} />
                  {selected && (
                    <span className="absolute -right-0.5 -bottom-0.5 rounded-full bg-primary p-0.5">
                      <Check className="size-2.5 text-primary-foreground" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Everyone in your leagues sees this picture. The ring around it is your team color in each league.
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
