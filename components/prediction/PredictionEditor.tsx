"use client";

import { useState } from "react";
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
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { type Racer, type PropName } from "@/lib/schemas";
import { PROP_META } from "@/lib/props";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { CheckIcon, LockIcon } from "lucide-react";
import { PropPicker } from "@/app/predict/PropPicker";
import { SortableRacerRow } from "@/components/SortableRacerRow";
import { SubmissionAttribution } from "@/app/predict/teammate-lineup/SubmissionAttribution";

type PredictionEditorRace = {
  id: string;
  title: string;
  date: string;
  startingGrid: string[];
};

type PredictionEditorProps = {
  race: PredictionEditorRace;
  racersById: Record<string, Racer>;
  initialRacerIds: string[];
  initialPropPicks: Partial<Record<PropName, string>>;
  isLocked: boolean;
  lockCountdown: string | null;
  saving: boolean;
  saved: boolean;
  onSubmit: (racerIds: string[], propPicks: Partial<Record<PropName, string>>) => void;
  submittedAt: string | null;
  submittedByName?: string | null;
  submitLabel: string;
  accentColor?: string;
  variant?: "default" | "outline";
};

const PROP_NAMES_ALL = Object.keys(PROP_META) as PropName[];

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" })
    .format(new Date(year, month - 1, day));
}

function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    .format(new Date(iso));
}

export function PredictionEditor({
  race,
  racersById,
  initialRacerIds,
  initialPropPicks,
  isLocked,
  lockCountdown,
  saving,
  saved,
  onSubmit,
  submittedAt,
  submittedByName,
  submitLabel,
  accentColor,
  variant = "default",
}: PredictionEditorProps) {
  const [orderedRacerIds, setOrderedRacerIds] = useState(initialRacerIds);
  const [propPicks, setPropPicks] = useState(initialPropPicks);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 0, tolerance: 5 } }),
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

  const racers = race.startingGrid.map((id) => racersById[id]).filter((r): r is Racer => !!r);
  const allPropsFilled = PROP_NAMES_ALL.every((p) => propPicks[p] != null);

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
          ) : lockCountdown !== null ? (
            <p className="text-xs font-mono text-state-upcoming">Locks in {lockCountdown}</p>
          ) : null}
        </div>
        {submittedAt ? (
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <span className="flex items-center gap-1.5 text-xs font-medium text-state-success bg-subtle border border-border rounded-sm px-2 py-1">
              <CheckIcon className="size-3" />
              Submitted
            </span>
            <span className="text-[10px] text-muted-foreground">{formatTimestamp(submittedAt)}</span>
            {submittedByName && (
              <SubmissionAttribution submittedByName={submittedByName} teamColor={accentColor} />
            )}
          </div>
        ) : (
          <span className="text-xs font-medium text-muted-foreground bg-muted rounded-sm px-2 py-1 shrink-0">
            No prediction yet
          </span>
        )}
      </div>

      <Separator />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} autoScroll={{ acceleration: 1, threshold: { x: 0.2, y: 0.2 } }}>
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

      <div className="space-y-2">
        {!isLocked && !allPropsFilled && (
          <p className="text-center text-[10px] font-mono uppercase tracking-[0.08em] text-text-tertiary">
            Pick all props to submit
          </p>
        )}
        <Button
          onClick={() => onSubmit(orderedRacerIds, propPicks)}
          disabled={saving || saved || isLocked || !allPropsFilled}
          className="w-full h-12 uppercase tracking-[0.06em] font-semibold"
          variant={variant}
          style={
            variant === "outline" && accentColor
              ? { borderColor: accentColor, color: accentColor }
              : undefined
          }
        >
          {saving && <Spinner className="w-3 h-3 mr-1" />}
          {saved ? <><CheckIcon className="w-3 h-3 mr-1" />Submitted</> : submitLabel}
        </Button>
      </div>
    </section>
  );
}
