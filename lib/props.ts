import { type PropName, type Racer } from "@/lib/schemas";

export const PROP_META: Record<PropName, { label: string; type: "driver" | "constructor" }> = {
  driverOfDay:    { label: "Driver of the Day", type: "driver" },
  lapsLed:        { label: "Laps Led",           type: "driver" },
  fastestPitStop: { label: "Fastest Pit Stop",   type: "constructor" },
  fastestLap:     { label: "Fastest Lap",         type: "driver" },
  overAchiever:   { label: "OverAchiever",        type: "driver" },
  underAchiever:  { label: "UnderAchiever",       type: "driver" },
  wrecker:        { label: "Wrecker",             type: "driver" },
};

export type PropOption = { id: string; label: string; color?: string };

// Accepts anything shaped like a racer for these fields — callers may pass
// either the full domain-backed Racer (admin flows) or the leaner
// client-facing racer DTO (prediction flows, which never carry motorsportId).
export type PropOptionRacer = Pick<Racer, "id" | "name" | "team" | "teamColor">;

export function getPropOptions(prop: PropName, racers: PropOptionRacer[]): PropOption[] {
  if (PROP_META[prop].type === "constructor") {
    const seen = new Set<string>();
    return racers
      .filter(r => { if (seen.has(r.team)) return false; seen.add(r.team); return true; })
      .map(r => ({ id: r.team, label: r.team, color: r.teamColor }));
  }
  return racers.map(r => ({ id: r.id, label: r.name, color: r.teamColor }));
}
