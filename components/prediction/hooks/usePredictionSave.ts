"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type PropName } from "@/lib/schemas";
import { orpc } from "@/lib/orpc/client";
import { useToast } from "@/app/context/ToastContext";

type UsePredictionSaveParams = {
  leagueId: string;
  raceId: string;
  /** Who the pick is for. Omit (or pass the session user's own id) for a self-pick. */
  targetUserId?: string;
};

type SaveResult = { submittedAt: string } | null;

export function usePredictionSave({ leagueId, raceId, targetUserId }: UsePredictionSaveParams) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const mutation = useMutation(
    orpc.predictions.submit.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.predictions.openRaces.key({ input: { leagueId } }),
        });
      },
      onError: () => {
        toast.error("Failed to save prediction. Please try again.");
      },
    }),
  );

  async function save(
    racerIds: string[],
    propPicks: Partial<Record<PropName, string>>,
  ): Promise<SaveResult> {
    try {
      // PredictionMutationSchema's propPicks is `z.record(PropNameSchema, ...).optional()` —
      // zod infers a record keyed by an enum as fully required when present, even though the
      // runtime schema (and the server command) happily accepts a partial subset of prop keys.
      // The UI already enforces all props are picked before submission is enabled
      // (see PredictionEditor's `allPropsFilled` gate), so this cast is safe.
      const result = await mutation.mutateAsync({
        leagueId,
        raceId,
        racerIds,
        propPicks: propPicks as Record<PropName, string>,
        targetUserId,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return result;
    } catch {
      return null;
    }
  }

  return { saving: mutation.isPending, saved, save };
}
