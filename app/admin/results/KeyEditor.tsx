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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Race, type Racer, type PropName } from "@/lib/schemas";
import { orpc } from "@/lib/orpc/client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { SortableRacerRow } from "@/components/SortableRacerRow";
import { PropGrader } from "./PropGrader";

type Props = {
  race: Race;
  motorsportId: string;
  racersById: Record<string, Racer>;
  existingKey: string[] | null;
  existingPropKey: Partial<Record<PropName, string[] | null>>;
  onSave: () => void;
  onCancel: () => void;
  onError: (msg: string) => void;
};

export function KeyEditor({ race, motorsportId, racersById, existingKey, existingPropKey, onSave, onCancel, onError }: Props) {
  const queryClient = useQueryClient();
  const [orderedIds, setOrderedIds] = useState<string[]>(existingKey ?? race.startingGrid);
  const [propResults, setPropResults] = useState<Partial<Record<PropName, string[] | null>>>(existingPropKey);

  const setKeyMutation = useMutation(
    orpc.races.setKey.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.races.list.key() }),
    }),
  );
  const saving = setKeyMutation.isPending;

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
    const propKey = {
      driverOfDay:    propResults.driverOfDay    ?? null,
      lapsLed:        propResults.lapsLed        ?? null,
      fastestPitStop: propResults.fastestPitStop ?? null,
      fastestLap:     propResults.fastestLap     ?? null,
      overAchiever:   propResults.overAchiever   ?? null,
      underAchiever:  propResults.underAchiever  ?? null,
      wrecker:        propResults.wrecker        ?? null,
    };
    try {
      await setKeyMutation.mutateAsync({ motorsportId, raceId: race.id, racerIds: orderedIds, propKey });
      onSave();
    } catch {
      onError("Failed to save result.");
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
