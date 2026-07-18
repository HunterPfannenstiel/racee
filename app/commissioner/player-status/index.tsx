"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RaceSelector } from "@/components/prediction/RaceSelector";
import { Separator } from "@/components/ui/separator";
import { orpc } from "@/lib/orpc/client";
import { LockStateAlert } from "./LockStateAlert";
import { MemberStatusSection } from "./MemberStatusSection";
import type { MemberSubmission } from "./types";

type PlayerStatusRace = {
  id: string;
  date: string;
};

function pickDefaultRaceId(races: PlayerStatusRace[]): string | null {
  if (races.length === 0) return null;
  const today = new Date().toISOString().split("T")[0];
  const upcoming = races.filter((r) => r.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  if (upcoming.length > 0) return upcoming[0].id;
  return [...races].sort((a, b) => b.date.localeCompare(a.date))[0].id;
}

export function PlayerStatus({ leagueId }: { leagueId: string }) {
  const [pickedRaceId, setPickedRaceId] = useState<string | null>(null);

  const racesQuery = useQuery(orpc.races.list.queryOptions({ input: { leagueId } }));
  const races = useMemo(() => racesQuery.data ?? [], [racesQuery.data]);

  // Same default-race rule the legacy hook applied: next upcoming race, else
  // the most recent past one — derived at render instead of synced via effect.
  const selectedRaceId = pickedRaceId ?? pickDefaultRaceId(races);

  const statusQuery = useQuery(
    orpc.leagues.playerStatus.get.queryOptions({
      input: { leagueId, raceId: selectedRaceId ?? "" },
      enabled: !!selectedRaceId,
    }),
  );

  const loading = racesQuery.isPending || (!!selectedRaceId && statusQuery.isPending);
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading submission status...</p>;
  }

  if (racesQuery.isError || statusQuery.isError) {
    return <p className="text-sm text-destructive">Failed to load submission status.</p>;
  }

  const locked = statusQuery.data?.race.locked ?? false;
  const lockTime = statusQuery.data?.race.lockTime ?? null;
  const withStatus: MemberSubmission[] = (statusQuery.data?.members ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    status: m.submittedAt ? "submitted" : locked ? "missed" : "pending",
    submittedAt: m.submittedAt,
  }));

  return (
    <div className="flex flex-col gap-4">
      <RaceSelector races={races} selectedRaceId={selectedRaceId ?? ""} onSelect={setPickedRaceId} />
      <LockStateAlert locked={locked} lockTime={lockTime} />

      <MemberStatusSection
        countLabel={`${withStatus.filter((m) => m.status !== "submitted").length} outstanding`}
        members={withStatus.filter((m) => m.status !== "submitted")}
        emptyState={{ title: "Everyone's in" }}
      />

      <Separator />

      <MemberStatusSection
        countLabel={`${withStatus.filter((m) => m.status === "submitted").length} submitted`}
        members={withStatus.filter((m) => m.status === "submitted")}
      />
    </div>
  );
}
