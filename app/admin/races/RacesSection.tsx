"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { type Race, type Racer } from "@/lib/schemas";
import { orpc } from "@/lib/orpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SortableRacerRow } from "@/components/SortableRacerRow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

type Editor = {
  raceId: string;
  title: string;
  label: string;
  date: string;
  lockTime: string;
  startingGrid: string[];
};

const EMPTY_EDITOR: Editor = { raceId: "", title: "", label: "", date: "", lockTime: "", startingGrid: [] };

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type GridEditor = {
  raceId: string;
  order: string[];
};

const EMPTY_GRID_EDITOR: GridEditor = { raceId: "", order: [] };

type Props = {
  motorsportId: string;
  races: Race[];
  racers: Racer[];
  onError: (msg: string) => void;
};

export function RacesSection({ motorsportId, races, racers, onError }: Props) {
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editor, setEditor] = useState<Editor>(EMPTY_EDITOR);
  const [gridEditorOpen, setGridEditorOpen] = useState(false);
  const [gridEditor, setGridEditor] = useState<GridEditor>(EMPTY_GRID_EDITOR);

  function invalidateRaces() {
    queryClient.invalidateQueries({ queryKey: orpc.races.list.key() });
  }

  const createMutation = useMutation(orpc.races.create.mutationOptions({ onSuccess: invalidateRaces }));
  const updateMutation = useMutation(orpc.races.update.mutationOptions({ onSuccess: invalidateRaces }));
  const deleteMutation = useMutation(orpc.races.delete.mutationOptions({ onSuccess: invalidateRaces }));
  const setGridMutation = useMutation(orpc.races.setGrid.mutationOptions({ onSuccess: invalidateRaces }));

  const busy =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || setGridMutation.isPending;
  const racersById = Object.fromEntries(racers.map((r) => [r.id, r]));

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleGridDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setGridEditor((g) => {
      const oldIndex = g.order.indexOf(active.id as string);
      const newIndex = g.order.indexOf(over.id as string);
      return { ...g, order: arrayMove(g.order, oldIndex, newIndex) };
    });
  }

  function openEditor(race?: Race) {
    setEditor(race
      ? { raceId: race.id, title: race.title, label: race.label ?? "", date: race.date, lockTime: race.lockTime ? isoToDatetimeLocal(race.lockTime) : "", startingGrid: race.startingGrid }
      : { ...EMPTY_EDITOR, raceId: crypto.randomUUID() }
    );
    setEditorOpen(true);
  }

  function openGridEditor(race: Race) {
    setGridEditor({ raceId: race.id, order: [...race.startingGrid] });
    setGridEditorOpen(true);
  }

  function toggleRacerId(racerId: string) {
    const startingGrid = editor.startingGrid.includes(racerId)
      ? editor.startingGrid.filter((id) => id !== racerId)
      : [...editor.startingGrid, racerId];
    setEditor({ ...editor, startingGrid });
  }

  async function commitRace() {
    if (!editor.title.trim() || !editor.date) return;
    const isNew = !races.some((r) => r.id === editor.raceId);
    try {
      if (isNew) {
        await createMutation.mutateAsync({
          id: editor.raceId,
          motorsportId,
          title: editor.title.trim(),
          label: editor.label.trim() || undefined,
          date: editor.date,
          lockTime: editor.lockTime ? new Date(editor.lockTime).toISOString() : undefined,
          startingGrid: editor.startingGrid,
        });
      } else {
        await updateMutation.mutateAsync({
          motorsportId,
          raceId: editor.raceId,
          patch: {
            title: editor.title.trim(),
            label: editor.label.trim() || undefined,
            date: editor.date,
            lockTime: editor.lockTime ? new Date(editor.lockTime).toISOString() : undefined,
          },
        });
      }
      setEditorOpen(false);
    } catch {
      onError("Failed to save race.");
    }
  }

  async function commitGrid() {
    const race = races.find((r) => r.id === gridEditor.raceId);
    if (!race) return;
    try {
      await setGridMutation.mutateAsync({
        motorsportId,
        raceId: race.id,
        startingGrid: gridEditor.order,
      });
      setGridEditorOpen(false);
    } catch {
      onError("Failed to save starting grid.");
    }
  }

  async function handleRemove(race: Race) {
    try {
      await deleteMutation.mutateAsync({ motorsportId, raceId: race.id });
    } catch {
      onError("Failed to delete race.");
    }
  }

  const sorted = [...races].sort((a, b) => a.date.localeCompare(b.date));
  const gridRace = races.find((r) => r.id === gridEditor.raceId);
  const isNew = !races.some((r) => r.id === editor.raceId);

  return (
    <>
      <Card>
        <CardHeader>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Races</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-1">
            {sorted.map((race) => (
              <li key={race.id} className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-sm font-medium">{race.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {race.date}
                    {race.lockTime && (
                      <span className="ml-2 text-amber-600">
                        locks {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(race.lockTime))}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1 items-center shrink-0">
                  {deleteMutation.isPending && deleteMutation.variables?.raceId === race.id && (
                    <Spinner className="w-3 h-3" />
                  )}
                  <Button variant="ghost" size="sm" onClick={() => openGridEditor(race)} disabled={busy}>Starting Grid</Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditor(race)} disabled={busy}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleRemove(race)} disabled={busy}>Remove</Button>
                </div>
              </li>
            ))}
          </ul>
          {races.length > 0 && <Separator />}
          <Button variant="outline" onClick={() => openEditor()} disabled={busy}>
            Create new race
          </Button>
        </CardContent>
      </Card>

      <Dialog open={editorOpen} onOpenChange={(open) => { if (!open && !busy) setEditorOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isNew ? "Create race" : "Edit race"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Race title</label>
              <Input
                value={editor.title}
                onChange={(e) => setEditor({ ...editor, title: e.target.value })}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <label className="text-xs text-muted-foreground">Column label (optional, e.g. AUS)</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="size-3 text-muted-foreground cursor-default" />
                  </TooltipTrigger>
                  <TooltipContent>Shown as the column header on the standings page. Falls back to the full race title if blank.</TooltipContent>
                </Tooltip>
              </div>
              <Input
                value={editor.label}
                onChange={(e) => setEditor({ ...editor, label: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Date</label>
              <Input
                type="date"
                value={editor.date}
                onChange={(e) => setEditor({ ...editor, date: e.target.value })}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Lock time (optional)</label>
              <Input
                type="datetime-local"
                value={editor.lockTime}
                onChange={(e) => setEditor({ ...editor, lockTime: e.target.value })}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Drivers</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const allSelected = racers.every((r) => editor.startingGrid.includes(r.id));
                    setEditor({ ...editor, startingGrid: allSelected ? [] : racers.map((r) => r.id) });
                  }}
                >
                  {racers.every((r) => editor.startingGrid.includes(r.id)) ? "Deselect all" : "Select all"}
                </Button>
              </div>
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {racers.map((racer) => (
                  <li key={racer.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`driver-${racer.id}`}
                      checked={editor.startingGrid.includes(racer.id)}
                      onChange={() => toggleRacerId(racer.id)}
                    />
                    <label htmlFor={`driver-${racer.id}`} className="text-sm cursor-pointer">
                      {racer.name} <span className="text-muted-foreground">— {racer.team}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={commitRace} disabled={busy || !editor.title.trim() || !editor.date}>
              {(createMutation.isPending || updateMutation.isPending) && <Spinner className="w-3 h-3 mr-1" />}
              Save
            </Button>
            <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={busy}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={gridEditorOpen} onOpenChange={(open) => { if (!open && !busy) setGridEditorOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{gridRace?.title} — Starting Grid</DialogTitle>
          </DialogHeader>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGridDragEnd}>
            <SortableContext items={gridEditor.order} strategy={verticalListSortingStrategy}>
              <ul className="space-y-1 max-h-[32rem] overflow-y-auto">
                {gridEditor.order.map((id, index) => {
                  const racer = racersById[id];
                  if (!racer) return null;
                  return <SortableRacerRow key={id} racerId={id} index={index} racer={racer} disabled={busy} />;
                })}
              </ul>
            </SortableContext>
          </DndContext>
          <DialogFooter>
            <Button onClick={commitGrid} disabled={busy}>
              {setGridMutation.isPending && <Spinner className="w-3 h-3 mr-1" />}
              Save
            </Button>
            <Button variant="outline" onClick={() => setGridEditorOpen(false)} disabled={busy}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
