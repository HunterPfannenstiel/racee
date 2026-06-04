"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVerticalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { RacerAvatar } from "@/components/RacerAvatar";
import { type Racer } from "@/lib/schemas";

type Props = {
  racerId: string;
  index: number;
  racer: Racer;
  disabled: boolean;
  startingGridPosition?: number;
};

export function SortableRacerRow({ racerId, index, racer, disabled, startingGridPosition }: Props) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: racerId });

  const dragListeners = disabled ? {} : listeners;
  const dragCursor = disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing";

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 min-h-12 py-1 rounded-sm select-none",
        isDragging ? "opacity-40 z-10" : "opacity-100",
        disabled && "opacity-40"
      )}
    >
      <div ref={setActivatorNodeRef} {...dragListeners} className={cn("touch-none shrink-0", dragCursor)}>
        <GripVerticalIcon className="size-5 p-0.5 text-muted-foreground" />
      </div>
      <span className="w-7 shrink-0 text-right text-xs font-mono font-semibold text-muted-foreground tabular-nums">
        P{index + 1}
      </span>
      {startingGridPosition !== undefined && (() => {
        const delta = startingGridPosition - index;
        return (
          <span className={cn("w-8 shrink-0 text-xs font-mono tabular-nums",
            delta > 0 ? "text-state-success" :
            delta < 0 ? "text-state-error" :
            "text-muted-foreground"
          )}>
            SG{startingGridPosition + 1}
          </span>
        );
      })()}
      <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: racer.teamColor ?? "#6b7280" }} />
      <RacerAvatar name={racer.name} image={racer.image} />
      <div className="flex-1 min-w-0">
        <p className="font-heading text-sm font-semibold truncate">{racer.name}</p>
        <p className="text-xs text-muted-foreground truncate">{racer.team}</p>
      </div>
    </li>
  );
}
