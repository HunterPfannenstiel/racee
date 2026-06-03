"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/context/UserContext";
import { useLeague } from "@/app/context/LeagueContext";
import { type Racer, type PropName } from "@/lib/schemas";
import { RequireUser } from "@/components/RequireUser";
import { PredictionForm } from "./PredictionForm";
import { PageShell } from "@/components/ui/page-shell";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { FlagIcon } from "lucide-react";

type MyPick = {
  racerIds: string[];
  propPicks: Partial<Record<PropName, string>>;
  submittedAt: string | null;
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

function formatChipDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
    .format(new Date(year, month - 1, day));
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

  useEffect(() => {
    if (!user || !activeLeagueId) return;
    setData(null);
    fetch(`/api/predict/init?leagueId=${activeLeagueId}`)
      .then((r) => r.json())
      .then((d) => {
        setData({ openRaces: d.openRaces, racersById: d.racersById });
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
      return {
        ...prev,
        openRaces: prev.openRaces.map((r) =>
          r.id === selectedRaceId && r.leagueId === activeLeagueId
            ? { ...r, myPick: { racerIds, propPicks, submittedAt } }
            : r,
        ),
      };
    });
  }

  const openRaces = data?.openRaces ?? [];
  const sortedRaces = [...openRaces].sort((a, b) => a.date.localeCompare(b.date));
  const selectedRace = openRaces.find((r) => r.id === selectedRaceId) ?? null;

  return (
    <PageShell title="Predict">
      <RequireUser>
        {!data ? (
          <PredictPagePlaceholder />
        ) : (
          <div className="space-y-5">

            {sortedRaces.length > 1 && (
              <div className="overflow-x-auto">
                <div className="flex gap-2 pb-0.5">
                  {sortedRaces.map((race) => {
                    const active = selectedRaceId === race.id;
                    return (
                      <button
                        key={race.id}
                        onClick={() => setSelectedRaceId(race.id)}
                        className={cn(
                          "shrink-0 rounded-sm px-3 py-2 text-left transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-subtle text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <p className="text-xs font-mono font-semibold leading-snug max-w-[120px] truncate">{race.title}</p>
                        <p className={cn("text-[10px] font-mono", active ? "opacity-70" : "")}>{formatChipDate(race.date)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedRace ? (
              <PredictionForm
                key={`${activeLeagueId}_${selectedRace.id}`}
                race={selectedRace}
                leagueId={activeLeagueId!}
                racersById={data.racersById}
                existingPrediction={selectedRace.myPick?.racerIds ?? null}
                existingSubmittedAt={selectedRace.myPick?.submittedAt ?? null}
                existingPropPicks={selectedRace.myPick?.propPicks ?? {}}
                keyIsSet={selectedRace.keyIsSet}
                onPredictionSave={handlePredictionSave}
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
