"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/context/UserContext";
import { useLeague } from "@/app/context/LeagueContext";
import { type Racer, type PropName } from "@/lib/schemas";
import { RequireUser } from "@/components/RequireUser";
import { PredictionForm } from "./PredictionForm";
import { TeammateSelector } from "./teammate-lineup/TeammateSelector";
import { useTeammateSelector } from "./teammate-lineup/hooks/useTeammateSelector";
import { RaceSelector } from "@/components/prediction/RaceSelector";
import { PageShell } from "@/components/ui/page-shell";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { FlagIcon } from "lucide-react";

type MyPick = {
  racerIds: string[];
  propPicks: Partial<Record<PropName, string>>;
  submittedAt: string | null;
  submittedBy: string | null;
  submittedByName: string | null;
};

type OpenRace = {
  id: string;
  leagueId: string;
  title: string;
  label?: string;
  date: string;
  lockTime?: string;
  startingGrid: string[];
  keyIsSet: boolean;
  myPick: MyPick | null;
};

type InitData = {
  openRaces: OpenRace[];
  racersById: Record<string, Racer>;
  teammates: { id: string; name: string }[];
  teamColor?: string;
  teammatePicks: Record<string, Record<string, MyPick>>;
};

function PredictPagePlaceholder() {
  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <div className="h-14 w-24 rounded-sm bg-subtle" />
        <div className="h-14 w-28 rounded-sm bg-subtle" />
      </div>
      <div className="space-y-2">
        <div className="h-2.5 w-20 rounded-sm bg-subtle" />
        <div className="h-7 w-44 rounded-sm bg-subtle" />
      </div>
      <Separator />
      <div className="space-y-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-11 rounded-sm bg-subtle" />
        ))}
      </div>
      <Separator />
      <div>
        <div className="h-2.5 w-16 rounded-sm bg-subtle mb-3" />
        <div className="border border-border rounded-sm overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={cn("h-14 flex items-center px-4", i < 6 && "border-b border-border")}>
              <div className="h-2.5 w-32 rounded-sm bg-subtle" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function autoSelectRace(races: OpenRace[]): string | null {
  const today = new Date().toISOString().split("T")[0];
  return (
    races.filter((r) => r.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0]?.id ??
    races.sort((a, b) => b.date.localeCompare(a.date))[0]?.id ??
    null
  );
}

export default function PredictPage() {
  const { user } = useUser();
  const { activeLeagueId } = useLeague();
  const [data, setData] = useState<InitData | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const { displayName, isProxy, selectedPlayerId, next, prev } =
    useTeammateSelector(data?.teammates ?? []);

  useEffect(() => {
    if (!user || !activeLeagueId) return;
    setData(null);
    fetch(`/api/predict/init?leagueId=${activeLeagueId}`)
      .then((r) => r.json())
      .then((d) => {
        setData({
          openRaces: d.openRaces,
          racersById: d.racersById,
          teammates: d.teammates ?? [],
          teamColor: d.teamColor,
          teammatePicks: d.teammatePicks ?? {},
        });
        setSelectedRaceId((current) => {
          if (current && d.openRaces.some((r: { id: string }) => r.id === current)) return current;
          return autoSelectRace(d.openRaces);
        });
      });
  }, [user, activeLeagueId]);

  function handlePredictionSave(racerIds: string[], submittedAt: string, propPicks: Partial<Record<PropName, string>>) {
    if (!selectedRaceId || !activeLeagueId) return;
    setData((prev) => {
      if (!prev) return prev;
      if (selectedPlayerId) {
        const raceTeammatePicks = { ...prev.teammatePicks[selectedRaceId] };
        raceTeammatePicks[selectedPlayerId] = {
          racerIds,
          propPicks,
          submittedAt,
          submittedBy: user?.id ?? null,
          submittedByName: null,
        };
        return {
          ...prev,
          teammatePicks: {
            ...prev.teammatePicks,
            [selectedRaceId]: raceTeammatePicks,
          },
        };
      }
      return {
        ...prev,
        openRaces: prev.openRaces.map((r) =>
          r.id === selectedRaceId && r.leagueId === activeLeagueId
            ? { ...r, myPick: { racerIds, propPicks, submittedAt, submittedBy: null, submittedByName: null } }
            : r,
        ),
      };
    });
  }

  const openRaces = data?.openRaces ?? [];
  const sortedRaces = [...openRaces].sort((a, b) => a.date.localeCompare(b.date));
  const selectedRace = openRaces.find((r) => r.id === selectedRaceId) ?? null;

  const activePick = (() => {
    if (!selectedRace || !data) return null;
    if (selectedPlayerId) {
      return data.teammatePicks[selectedRace.id]?.[selectedPlayerId] ?? null;
    }
    return selectedRace.myPick;
  })();

  const resolvedSubmittedByName = activePick?.submittedBy
    ? (activePick.submittedByName ?? "You")
    : null;

  return (
    <PageShell title="Predict">
      <RequireUser>
        {!data ? (
          <PredictPagePlaceholder />
        ) : (
          <div className="space-y-5">

            <RaceSelector races={sortedRaces} selectedRaceId={selectedRaceId} onSelect={setSelectedRaceId} />

            {data.teammates.length > 0 && (
              <TeammateSelector
                displayName={displayName}
                isProxy={isProxy}
                teamColor={data.teamColor}
                onNext={next}
                onPrev={prev}
              />
            )}

            {selectedRace ? (
              <PredictionForm
                key={`${activeLeagueId}_${selectedRace.id}_${selectedPlayerId ?? user?.id}`}
                race={selectedRace}
                leagueId={activeLeagueId!}
                racersById={data.racersById}
                existingPrediction={activePick?.racerIds ?? null}
                existingSubmittedAt={activePick?.submittedAt ?? null}
                existingPropPicks={activePick?.propPicks ?? {}}
                existingSubmittedByName={resolvedSubmittedByName}
                keyIsSet={selectedRace.keyIsSet}
                onPredictionSave={handlePredictionSave}
                isProxy={isProxy}
                targetUserId={selectedPlayerId ?? user?.id}
                targetUserName={displayName}
                teamColor={data.teamColor}
              />
            ) : (
              <div className="flex flex-col items-center text-center pt-12 gap-4">
                <FlagIcon className="size-12 text-text-tertiary" strokeWidth={1.5} />
                <div className="space-y-1">
                  <p className="font-heading text-[1.75rem] font-bold text-foreground">No Active Race</p>
                  <p className="text-sm font-mono text-muted-foreground">No races are scheduled for this league yet.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </RequireUser>
    </PageShell>
  );
}
