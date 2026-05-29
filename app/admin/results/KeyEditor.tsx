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
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { type Race, type Racer, type PropName } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { SortableRacerRow } from "@/components/SortableRacerRow";
import { PropGrader } from "./PropGrader";

type Props = {
  race: Race;
  racersById: Record<string, Racer>;
  existingKey: string[] | null;
  existingPropKey: Partial<Record<PropName, string[] | null>>;
  onSave: () => void;
  onCancel: () => void;
  onError: (msg: string) => void;
};

export function KeyEditor({ race, racersById, existingKey, existingPropKey, onSave, onCancel, onError }: Props) {
  const [orderedIds, setOrderedIds] = useState<string[]>(existingKey ?? race.startingGrid);
  const [propResults, setPropResults] = useState<Partial<Record<PropName, string[] | null>>>(existingPropKey);
  const [saving, setSaving] = useState(false);

  const racers = race.startingGrid.map((id) => racersById[id]).filter((r): r is Racer => !!r);

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
      const propKey = {
        driverOfDay:    propResults.driverOfDay    ?? null,
        lapsLed:        propResults.lapsLed        ?? null,
        fastestPitStop: propResults.fastestPitStop ?? null,
        fastestLap:     propResults.fastestLap     ?? null,
        overAchiever:   propResults.overAchiever   ?? null,
        underAchiever:  propResults.underAchiever  ?? null,
        wrecker:        propResults.wrecker        ?? null,
      };
      const res = await fetch("/api/races/key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId: race.leagueId, raceId: race.id, racerIds: orderedIds, propKey }),
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
              return <SortableRacerRow key={id} racerId={id} index={index} racer={racer} disabled={saving} />;
            })}
          </ul>
        </SortableContext>
      </DndContext>

      <Separator />

      <PropGrader
        racers={racers}
        propResults={propResults}
        onChange={setPropResults}
        disabled={saving}
      />

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
