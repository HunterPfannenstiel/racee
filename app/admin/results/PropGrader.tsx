"use client";

import { useState } from "react";
import { type PropName, type Racer } from "@/lib/schemas";
import { PROP_META, getPropOptions } from "@/lib/props";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  racers: Racer[];
  propResults: Partial<Record<PropName, string[] | null>>;
  onChange: (results: Partial<Record<PropName, string[] | null>>) => void;
  disabled: boolean;
};

const emptySearch = () =>
  Object.fromEntries(Object.keys(PROP_META).map((k) => [k, ""])) as Record<PropName, string>;

export function PropGrader({ racers, propResults, onChange, disabled }: Props) {
  const [search, setSearch] = useState<Record<PropName, string>>(emptySearch);

  function toggleOption(prop: PropName, id: string) {
    const current = propResults[prop];
    const currentArr = Array.isArray(current) ? current : [];
    const next = currentArr.includes(id)
      ? currentArr.filter((v) => v !== id)
      : [...currentArr, id];
    onChange({ ...propResults, [prop]: next });
  }

  function toggleNoResult(prop: PropName) {
    onChange({ ...propResults, [prop]: propResults[prop] === null ? undefined : null });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Prop Results</p>
      {(Object.keys(PROP_META) as PropName[]).map((prop) => {
        const options = getPropOptions(prop, racers);
        const query = search[prop].toLowerCase();
        const visible = query ? options.filter((o) => o.label.toLowerCase().includes(query)) : options;
        const current = propResults[prop];
        const isNoResult = current === null;
        const selected = Array.isArray(current) ? current : [];
        return (
          <div key={prop} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium shrink-0">{PROP_META[prop].label}</p>
              <Input
                placeholder="Search…"
                value={search[prop]}
                onChange={(e) => setSearch((s) => ({ ...s, [prop]: e.target.value }))}
                disabled={disabled}
                className="h-7 text-xs flex-1"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {visible.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => toggleOption(prop, opt.id)}
                  disabled={disabled || isNoResult}
                  style={selected.includes(opt.id) && opt.color ? { backgroundColor: opt.color } : undefined}
                  className={cn(
                    "rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors",
                    selected.includes(opt.id)
                      ? "text-white border-transparent"
                      : "hover:border-foreground text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  {opt.label}
                </button>
              ))}
              {visible.length === 0 && !isNoResult && (
                <span className="text-xs text-muted-foreground">No matches.</span>
              )}
              <button
                onClick={() => toggleNoResult(prop)}
                disabled={disabled}
                className={cn(
                  "rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors",
                  isNoResult
                    ? "border-destructive bg-destructive text-destructive-foreground"
                    : "border-dashed hover:border-foreground text-muted-foreground hover:text-foreground"
                )}
              >
                No Result
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
