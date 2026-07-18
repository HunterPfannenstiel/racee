"use client";

import { useState } from "react";
import { type PropName } from "@/lib/schemas";
import { PROP_META, getPropOptions, type PropOptionRacer } from "@/lib/props";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  racers: PropOptionRacer[];
  propPicks: Partial<Record<PropName, string>>;
  onChange: (picks: Partial<Record<PropName, string>>) => void;
  disabled: boolean;
};

const PROP_NAMES = Object.keys(PROP_META) as PropName[];

export function PropPicker({ racers, propPicks, onChange, disabled }: Props) {
  const [activeProp, setActiveProp] = useState<PropName | null>(null);

  function handleSelect(prop: PropName, optionId: string) {
    const next: Partial<Record<PropName, string>> = { ...propPicks };
    if (next[prop] === optionId) {
      delete next[prop];
    } else {
      next[prop] = optionId;
    }
    onChange(next);
    setActiveProp(null);
  }

  const activeOptions = activeProp ? getPropOptions(activeProp, racers) : [];

  return (
    <>
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.08em] text-muted-foreground mb-3">
          Prop Bets
        </p>
        <div className="border border-border rounded-sm overflow-hidden">
          {PROP_NAMES.map((prop, i) => {
            const selectedId = propPicks[prop];
            const selectedLabel = selectedId
              ? getPropOptions(prop, racers).find((o) => o.id === selectedId)?.label
              : null;
            const isLast = i === PROP_NAMES.length - 1;

            return (
              <button
                key={prop}
                onClick={() => setActiveProp(prop)}
                disabled={disabled}
                className={cn(
                  "w-full flex items-center justify-between px-4 min-h-[56px] text-left transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  !disabled && "hover:bg-subtle",
                  !isLast && "border-b border-border"
                )}
              >
                <span className="text-xs font-mono uppercase tracking-[0.08em] text-muted-foreground">
                  {PROP_META[prop].label}
                </span>
                <span className="flex items-center gap-2 shrink-0 ml-4">
                  {selectedLabel ? (
                    <>
                      <span className="text-xs font-mono text-foreground truncate max-w-[120px]">
                        {selectedLabel}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">EDIT ›</span>
                    </>
                  ) : (
                    <span className="text-xs font-mono text-state-open">PICK ›</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Drawer open={activeProp !== null} onOpenChange={(open) => !open && setActiveProp(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-xs font-mono uppercase tracking-[0.08em] text-muted-foreground text-left">
              {activeProp ? PROP_META[activeProp].label : ""}
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            {activeOptions.map((opt) => {
              const isSelected = activeProp ? propPicks[activeProp] === opt.id : false;
              return (
                <button
                  key={opt.id}
                  onClick={() => activeProp && handleSelect(activeProp, opt.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 h-[52px] text-left transition-colors border-b border-border last:border-b-0",
                    isSelected ? "bg-subtle" : "hover:bg-subtle"
                  )}
                >
                  {opt.color && (
                    <span
                      className="shrink-0 w-3 h-3 rounded-full"
                      style={{ backgroundColor: opt.color }}
                    />
                  )}
                  <span className="flex-1 text-sm font-mono text-foreground truncate">
                    {opt.label}
                  </span>
                  {isSelected && (
                    <CheckIcon className="shrink-0 size-4 text-state-success" />
                  )}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
