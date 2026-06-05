"use client";

import { type PlacementPoints } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";

type Props = {
  value: PlacementPoints;
  onChange: (value: PlacementPoints) => void;
  disabled?: boolean;
};

function label(index: number) {
  return index === 0 ? "Exact match" : `Off by ${index}`;
}

export function PlacementPointsEditor({ value, onChange, disabled }: Props) {
  function updateAt(index: number, pts: number) {
    const next = [...value];
    next[index] = pts;
    onChange(next);
  }

  function addTier() {
    onChange([...value, 0]);
  }

  function removeLast() {
    onChange(value.slice(0, -1));
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Placement Points
      </p>
      {value.length === 0 ? (
        <p className="text-xs text-muted-foreground">No tiers defined.</p>
      ) : (
        <div className="space-y-1.5">
          {value.map((pts, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm flex-1">{label(i)}</span>
              <NumberInput
                value={pts}
                onChange={(v) => updateAt(i, v)}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addTier} disabled={disabled}>
          + Add tier
        </Button>
        {value.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={removeLast} disabled={disabled}>
            Remove last
          </Button>
        )}
      </div>
    </div>
  );
}
