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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { RacerAvatar } from "@/components/RacerAvatar";
import { GripVerticalIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  race: Race;
  racersById: Record<string, Racer>;
  onSave: () => void;
  onCancel: () => void;
  onError: (msg: string) => void;
};

function SortableRow({ racerId, index, racer, disabled }: {
  racerId: string;
  index: number;
  racer: Racer;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: racerId });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-3 py-1 rounded-sm select-none", isDragging ? "opacity-40" : "")}
    >
      <button
        {...listeners}
        {...attributes}
        disabled={disabled}
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

export function KeyEditor({ race, racersById, onSave, onCancel, onError }: Props) {
  const [orderedIds, setOrderedIds] = useState<string[]>(race.racerIds);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setOrderedIds((ids) => {
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      return arrayMove(ids, oldIndex, newIndex);
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/races/key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seasonId: race.seasonId, raceId: race.id, racerIds: orderedIds }),
      });
      if (!res.ok) { onError("Failed to save result."); return; }
      onSave();
    } catch {
      onError("Failed to save result.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-sm border border-primary bg-card p-5 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {race.title} — Set Finish Order
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          <ul className="space-y-1 max-h-[32rem] overflow-y-auto">
            {orderedIds.map((id, index) => {
              const racer = racersById[id];
              if (!racer) return null;
              return <SortableRow key={id} racerId={id} index={index} racer={racer} disabled={saving} />;
            })}
          </ul>
        </SortableContext>
      </DndContext>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Spinner className="w-3 h-3 mr-1" />}
          Save Result
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
      </div>
    </div>
  );
}
