"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TeamLogo } from "@/components/avatar/TeamLogo";
import type { AvatarSize } from "@/components/avatar/PlayerAvatar";
import { resizeImageToDataUrl } from "@/components/avatar/resizeImage";


type Props = {
  leagueId: string;
  team: { id: string; name: string; color?: string | null; logo?: string | null };
  disabled?: boolean;
  size?: AvatarSize;
};

/** Tap the logo to upload a new one, or remove it. For a team's members and the league's commissioners. */
export function TeamLogoUpload({ leagueId, team, disabled, size = "lg" }: Props) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = { leagueId };

  const mutation = useMutation(
    orpc.leagues.teams.setLogo.mutationOptions({
      onSuccess: () => {
        setError(null);
        queryClient.invalidateQueries({ queryKey: orpc.leagues.teams.roster.key({ input }) });
        queryClient.invalidateQueries({ queryKey: orpc.leagues.teams.list.key({ input }) });
        queryClient.invalidateQueries({ queryKey: orpc.leagues.teams.dashboard.key() });
      },
      onError: (e) => setError(e instanceof Error && e.message ? e.message : "Couldn't save the logo."),
    }),
  );
  const busy = disabled || processing || mutation.isPending;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setProcessing(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      mutation.mutate({ leagueId, teamId: team.id, dataUrl });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that image.");
    } finally {
      setProcessing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <span className="relative">
        {/* Tapping the logo blows it up; only the camera button changes it. */}
        <TeamLogo leagueId={leagueId} teamId={team.id} name={team.name} color={team.color} logo={team.logo} size={size} action="zoom" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border border-border bg-background shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
          aria-label={team.logo ? `Change ${team.name} logo` : `Upload ${team.name} logo`}
          title={team.logo ? "Change logo" : "Upload logo"}
        >
          {processing || mutation.isPending ? <Spinner className="size-3" /> : <Camera className="size-3.5 text-muted-foreground" />}
        </button>
      </span>
      {team.logo && (
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-[10px] text-muted-foreground"
          onClick={() => mutation.mutate({ leagueId, teamId: team.id, dataUrl: null })}
          disabled={busy}
        >
          Remove
        </Button>
      )}
      {error && <p className="max-w-24 text-center text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
