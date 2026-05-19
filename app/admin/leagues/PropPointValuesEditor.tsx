"use client";

import { type PropPointValues, type PropName } from "@/lib/schemas";
import { PROP_META } from "@/lib/props";
import { Input } from "@/components/ui/input";

type Props = {
  values: PropPointValues;
  onChange: (values: PropPointValues) => void;
  disabled?: boolean;
};

export function PropPointValuesEditor({ values, onChange, disabled }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Prop Point Values
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {(Object.keys(PROP_META) as PropName[]).map((prop) => (
          <div key={prop} className="flex items-center gap-2">
            <label className="text-sm flex-1">{PROP_META[prop].label}</label>
            <Input
              type="number"
              min={0}
              className="w-16 text-right"
              value={values[prop]}
              onChange={(e) =>
                onChange({ ...values, [prop]: Math.max(0, parseInt(e.target.value) || 0) })
              }
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
