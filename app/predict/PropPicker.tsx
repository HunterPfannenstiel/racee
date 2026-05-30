"use client";

import { useState } from "react";
import { type PropName, type Racer } from "@/lib/schemas";
import { PROP_META, getPropOptions } from "@/lib/props";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  racers: Racer[];
  propPicks: Partial<Record<PropName, string>>;
  onChange: (picks: Partial<Record<PropName, string>>) => void;
  disabled: boolean;
};

const emptySearch = () =>
  Object.fromEntries(Object.keys(PROP_META).map((k) => [k, ""])) as Record<PropName, string>;

export function PropPicker({ racers, propPicks, onChange, disabled }: Props) {
  const [search, setSearch] = useState<Record<PropName, string>>(emptySearch);

  function toggle(prop: PropName, id: string) {
    onChange({ ...propPicks, [prop]: propPicks[prop] === id ? undefined : id });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Prop Bets</p>
      {(Object.keys(PROP_META) as PropName[]).map((prop) => {
        const options = getPropOptions(prop, racers);
        const query = search[prop].toLowerCase();
        const visible = query ? options.filter((o) => o.label.toLowerCase().includes(query)) : options;
        const selected = propPicks[prop];
        return (
          <div key={prop} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium shrink-0">{PROP_META[prop].label}</p>
              <Input
                placeholder="Search…"
                value={search[prop]}
                onChange={(e) => setSearch((s) => ({ ...s, [prop]: e.target.value }))}
                disabled={disabled}
                className="h-7 text-xs flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {visible.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => toggle(prop, opt.id)}
                  disabled={disabled}
                  style={selected === opt.id && opt.color ? { backgroundColor: opt.color } : undefined}
                  className={cn(
                    "rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    selected === opt.id
                      ? "text-white border-transparent"
                      : "hover:border-foreground text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
              {visible.length === 0 && (
                <span className="text-xs text-muted-foreground">No matches.</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
