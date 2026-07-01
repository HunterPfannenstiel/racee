"use client";

import { RaceSelector } from "@/components/prediction/RaceSelector";
import { Separator } from "@/components/ui/separator";
import { LockStateAlert } from "./LockStateAlert";
import { MemberStatusSection } from "./MemberStatusSection";
import { usePlayerStatus } from "./hooks/usePlayerStatus";

export function PlayerStatus({ leagueId }: { leagueId: string }) {
  const {
    races,
    selectedRaceId,
    setSelectedRaceId,
    locked,
    lockTime,
    outstanding,
    submitted,
    loading,
    error,
  } = usePlayerStatus(leagueId);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading submission status...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <RaceSelector races={races} selectedRaceId={selectedRaceId} onSelect={setSelectedRaceId} />
      <LockStateAlert locked={locked} lockTime={lockTime} />

      <MemberStatusSection
        countLabel={`${outstanding.length} outstanding`}
        members={outstanding}
        emptyState={{ title: "Everyone's in" }}
      />

      <Separator />

      <MemberStatusSection countLabel={`${submitted.length} submitted`} members={submitted} />
    </div>
  );
}
