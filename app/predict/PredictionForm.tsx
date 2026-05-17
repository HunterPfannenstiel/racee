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
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type Race, type Racer } from "@/lib/schemas";
import { useUser } from "@/app/context/UserContext";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { RacerAvatar } from "@/components/RacerAvatar";
import { Separator } from "@/components/ui/separator";
import { CheckIcon, GripVerticalIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  race: Race;
  racersById: Record<string, Racer>;
  existingPrediction: string[] | null;
  onPredictionSave: (racerIds: string[]) => void;
  onError: (msg: string) => void;
};

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" })
    .format(new Date(year, month - 1, day));
}

type RowProps = {
  racerId: string;
  index: number;
  racer: Racer;
  disabled: boolean;
};

function SortableRacerRow({ racerId, index, racer, disabled }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: racerId,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 py-1 rounded-sm select-none",
        isDragging ? "opacity-40 z-10" : "opacity-100"
      )}
    >
      <button
        {...listeners}
        {...attributes}
        disabled={disabled}
        tabIndex={0}
        className="touch-none p-1 -ml-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        aria-label={`Drag to reorder ${racer.name}`}
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <span className="w-7 shrink-0 text-right text-xs font-mono font-semibold text-muted-foreground tabular-nums">
        P{index + 1}
      </span>
      <RacerAvatar name={racer.name} image={racer.image} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{racer.name}</p>
        <p className="text-xs text-muted-foreground truncate">{racer.team}</p>
      </div>
    </li>
  );
}

export function PredictionForm({ race, racersById, existingPrediction, onPredictionSave, onError }: Props) {
  const { user } = useUser();
  const [orderedRacerIds, setOrderedRacerIds] = useState<string[]>(
    existingPrediction ?? race.racerIds
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
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
        body: JSON.stringify({ seasonId: race.seasonId, raceId: race.id, userId: user.id, racerIds: orderedRacerIds }),
      });
      if (!res.ok) { onError("Failed to save prediction."); return; }
      onPredictionSave(orderedRacerIds);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      onError("Failed to save prediction.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4 rounded-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {formatDate(race.date)}
          </p>
          <h2 className="text-lg font-bold tracking-tight text-foreground">{race.title}</h2>
        </div>
        {existingPrediction ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-sm px-2 py-1 shrink-0">
            <CheckIcon className="size-3" />
            Submitted
          </span>
        ) : (
          <span className="text-xs font-medium text-muted-foreground bg-muted rounded-sm px-2 py-1 shrink-0">
            No prediction yet
          </span>
        )}
      </div>

      <Separator />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedRacerIds} strategy={verticalListSortingStrategy}>
          <ul className="space-y-1 max-h-[32rem] overflow-y-auto">
            {orderedRacerIds.map((racerId, index) => {
              const racer = racersById[racerId];
              if (!racer) return null;
              return (
                <SortableRacerRow
                  key={racerId}
                  racerId={racerId}
                  index={index}
                  racer={racer}
                  disabled={saving}
                />
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>

      <Button onClick={savePrediction} disabled={saving || saved}>
        {saving && <Spinner className="w-3 h-3 mr-1" />}
        {saved ? <><CheckIcon className="w-3 h-3 mr-1" />Saved</> : "Save prediction"}
      </Button>
    </section>
  );
}
