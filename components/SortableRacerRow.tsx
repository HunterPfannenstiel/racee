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
};

export function SortableRacerRow({ racerId, index, racer, disabled }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: racerId });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-3 py-1 rounded-sm select-none", isDragging ? "opacity-40 z-10" : "opacity-100")}
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
      <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: racer.teamColor ?? "#6b7280" }} />
      <RacerAvatar name={racer.name} image={racer.image} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{racer.name}</p>
        <p className="text-xs text-muted-foreground truncate">{racer.team}</p>
      </div>
    </li>
  );
}
