"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  value: number[] | undefined;
  onChange: (value: number[] | undefined) => void;
  disabled?: boolean;
};

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export function TeamPositionPointsEditor({ value, onChange, disabled }: Props) {
  const pts = value ?? [];

  function updateAt(index: number, p: number) {
    const next = [...pts];
    next[index] = p;
    onChange(next);
  }

  function addPosition() {
    onChange([...pts, 0]);
  }

  function removeLast() {
    const next = pts.slice(0, -1);
    onChange(next.length === 0 ? undefined : next);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Team Scoring
      </p>
      {pts.length === 0 ? (
        <p className="text-xs text-muted-foreground">No positions defined — team standings disabled.</p>
      ) : (
        <div className="space-y-1.5">
          {pts.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm flex-1">{ordinal(i + 1)} place</span>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-16 text-right"
                value={p}
                onChange={(e) => updateAt(i, Math.max(0, parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0))}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addPosition} disabled={disabled}>
          + Add position
        </Button>
        {pts.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={removeLast} disabled={disabled}>
            Remove last
          </Button>
        )}
      </div>
    </div>
  );
}
