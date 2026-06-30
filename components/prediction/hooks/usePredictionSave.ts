"use client";

import { useState } from "react";
import { type PropName } from "@/lib/schemas";
import { useToast } from "@/app/context/ToastContext";

type UsePredictionSaveParams = {
  leagueId: string;
  raceId: string;
  userId: string;
};

type SaveResult = { submittedAt: string } | null;

export function usePredictionSave({ leagueId, raceId, userId }: UsePredictionSaveParams) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(
    racerIds: string[],
    propPicks: Partial<Record<PropName, string>>,
  ): Promise<SaveResult> {
    setSaving(true);
    try {
      const res = await fetch("/api/predict/prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId, raceId, userId, racerIds, propPicks }),
      });
      if (!res.ok) {
        toast.error("Failed to save prediction. Please try again.");
        return null;
      }
      const submittedAt = new Date().toISOString();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return { submittedAt };
    } catch {
      toast.error("Failed to save prediction. Please try again.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  return { saving, saved, save };
}
