"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { type Racer, type PropName } from "@/lib/schemas";
import { PROP_META } from "@/lib/props";
import { useUser } from "@/app/context/UserContext";
import { useToast } from "@/app/context/ToastContext";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { CheckIcon, LockIcon } from "lucide-react";
import { PropPicker } from "./PropPicker";
import { SortableRacerRow } from "@/components/SortableRacerRow";

type PredictRace = {
  id: string;
  leagueId: string;
  title: string;
  label?: string;
  date: string;
  lockTime?: string;
  startingGrid: string[];
};

type Props = {
  race: PredictRace;
  leagueId: string;
  racersById: Record<string, Racer>;
  existingPrediction: string[] | null;
  existingSubmittedAt: string | null;
  existingPropPicks: Partial<Record<PropName, string>>;
  keyIsSet: boolean;
  onPredictionSave: (racerIds: string[], submittedAt: string, propPicks: Partial<Record<PropName, string>>) => void;
};

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" })
    .format(new Date(year, month - 1, day));
}

function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    .format(new Date(iso));
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

const PROP_NAMES_ALL = Object.keys(PROP_META) as PropName[];

export function PredictionForm({ race, leagueId, racersById, existingPrediction, existingSubmittedAt, existingPropPicks, keyIsSet, onPredictionSave }: Props) {
  const { user } = useUser();
  const toast = useToast();
  const [orderedRacerIds, setOrderedRacerIds] = useState<string[]>(
    existingPrediction ?? race.startingGrid
  );
  const [propPicks, setPropPicks] = useState<Partial<Record<PropName, string>>>(existingPropPicks);
  const [submittedAt, setSubmittedAt] = useState<string | null>(existingSubmittedAt);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLocked, setIsLocked] = useState(() =>
    keyIsSet || (!!race.lockTime && Date.now() >= new Date(race.lockTime).getTime())
  );
  const [countdown, setCountdown] = useState<string | null>(() => {
    if (!race.lockTime) return null;
    const ms = new Date(race.lockTime).getTime() - Date.now();
    return ms > 0 ? formatCountdown(ms) : null;
  });

  useEffect(() => {
    if (keyIsSet || !race.lockTime) return;
    function tick() {
      const ms = new Date(race.lockTime!).getTime() - Date.now();
      if (ms <= 0) {
        setIsLocked(true);
        setCountdown(null);
      } else {
        setCountdown(formatCountdown(ms));
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [race.lockTime]);

  const racers = race.startingGrid.map((id) => racersById[id]).filter((r): r is Racer => !!r);
  const allPropsFilled = PROP_NAMES_ALL.every((p) => propPicks[p] != null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setOrderedRacerIds((ids) => {
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      return arrayMove(ids, oldIndex, newIndex);
    });
  }

  async function savePrediction() {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/predict/prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId, raceId: race.id, userId: user.id, racerIds: orderedRacerIds, propPicks }),
      });
      if (!res.ok) { toast.error("Failed to save prediction. Please try again."); return; }
      const now = new Date().toISOString();
      setSubmittedAt(now);
      onPredictionSave(orderedRacerIds, now, propPicks);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("Failed to save prediction. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4 rounded-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-xs font-mono uppercase tracking-[0.08em] text-muted-foreground">
            {formatDate(race.date)}
          </p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">{race.title}</h2>
          {isLocked ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.08em] text-state-locked border border-state-locked/40 rounded-sm px-2 py-0.5">
              <LockIcon className="size-3" />
              Locked
            </span>
          ) : countdown !== null ? (
            <p className="text-xs font-mono text-state-upcoming">Locks in {countdown}</p>
          ) : null}
        </div>
        {existingPrediction ? (
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <span className="flex items-center gap-1.5 text-xs font-medium text-state-success bg-subtle border border-border rounded-sm px-2 py-1">
              <CheckIcon className="size-3" />
              Submitted
            </span>
            {submittedAt && (
              <span className="text-[10px] text-muted-foreground">{formatTimestamp(submittedAt)}</span>
            )}
          </div>
        ) : (
          <span className="text-xs font-medium text-muted-foreground bg-muted rounded-sm px-2 py-1 shrink-0">
            No prediction yet
          </span>
        )}
      </div>

      <Separator />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedRacerIds} strategy={verticalListSortingStrategy}>
          <ul className="space-y-1">
            {orderedRacerIds.map((racerId, index) => {
              const racer = racersById[racerId];
              if (!racer) return null;
              return (
                <SortableRacerRow
                  key={racerId}
                  racerId={racerId}
                  index={index}
                  racer={racer}
                  disabled={saving || isLocked}
                  startingGridPosition={race.startingGrid.indexOf(racerId)}
                />
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>

      <Separator />

      <PropPicker
        racers={racers}
        propPicks={propPicks}
        onChange={setPropPicks}
        disabled={saving || isLocked}
      />

      <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-background border-t border-border md:static md:mx-0 md:px-0 md:py-0 md:bg-transparent md:border-none space-y-2">
        {!isLocked && !allPropsFilled && (
          <p className="text-center text-[10px] font-mono uppercase tracking-[0.08em] text-text-tertiary">
            Pick all props to submit
          </p>
        )}
        <Button onClick={savePrediction} disabled={saving || saved || isLocked || !allPropsFilled} className="w-full h-12 uppercase tracking-[0.06em] font-semibold">
          {saving && <Spinner className="w-3 h-3 mr-1" />}
          {saved ? <><CheckIcon className="w-3 h-3 mr-1" />Submitted</> : "Submit Predictions"}
        </Button>
      </div>
    </section>
  );
}
