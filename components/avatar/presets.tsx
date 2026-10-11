import type { CSSProperties } from "react";
import {
  BatteryCharging, CarFront, Cog, Crown, Flame, Fuel, Gauge, Hammer, KeyRound, Medal,
  Route, Siren, Timer, TrafficCone, Trophy, Wind, Wrench, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AvatarPresetId } from "@/lib/avatar";
import {
  CheckeredFlagIcon, F1CarIcon, HelmetIcon, StartLightsIcon, SteeringWheelIcon, TyreIcon,
} from "./racing-icons";

type GlyphComponent = (props: { className?: string; style?: CSSProperties; "aria-hidden"?: boolean | "true" | "false" }) => React.ReactNode;

export type AvatarPreset = {
  label: string;
  bg: string;
} & ({ Icon: GlyphComponent; text?: never } | { text: string; Icon?: never });

/** The 30 built-in profile icons — all racing, car or garage themed — each on a colored disc. */
export const AVATAR_PRESETS: Record<AvatarPresetId, AvatarPreset> = {
  // Cars & track
  car:        { label: "F1 car",          Icon: F1CarIcon,         bg: "#b91c1c" },
  flag:       { label: "Checkered flag",  Icon: CheckeredFlagIcon, bg: "#1f2937" },
  helmet:     { label: "Helmet",          Icon: HelmetIcon,        bg: "#1d4ed8" },
  steering:   { label: "Steering wheel",  Icon: SteeringWheelIcon, bg: "#334155" },
  tyre:       { label: "Tyre",            Icon: TyreIcon,          bg: "#18181b" },
  lights:     { label: "Start lights",    Icon: StartLightsIcon,   bg: "#7f1d1d" },
  roadcar:    { label: "Road car",        Icon: CarFront,          bg: "#0e7490" },
  safetycar:  { label: "Safety car",      Icon: Siren,             bg: "#a16207" },
  cone:       { label: "Cone",            Icon: TrafficCone,       bg: "#c2410c" },
  racingline: { label: "Racing line",     Icon: Route,             bg: "#9f1239" },
  wind:       { label: "Slipstream",      Icon: Wind,              bg: "#0369a1" },
  // Speed & glory
  gauge:      { label: "Speedometer",     Icon: Gauge,             bg: "#0f766e" },
  timer:      { label: "Stopwatch",       Icon: Timer,             bg: "#075985" },
  bolt:       { label: "Lightning",       Icon: Zap,               bg: "#ca8a04" },
  flame:      { label: "Flame",           Icon: Flame,             bg: "#ea580c" },
  trophy:     { label: "Trophy",          Icon: Trophy,            bg: "#b45309" },
  medal:      { label: "Medal",           Icon: Medal,             bg: "#a16207" },
  crown:      { label: "Champion",        Icon: Crown,             bg: "#7e22ce" },
  // Garage
  wrench:     { label: "Wrench",          Icon: Wrench,            bg: "#475569" },
  hammer:     { label: "Hammer",          Icon: Hammer,            bg: "#57534e" },
  gearbox:    { label: "Gearbox",         Icon: Cog,               bg: "#3f3f46" },
  fuel:       { label: "Fuel",            Icon: Fuel,              bg: "#15803d" },
  ers:        { label: "ERS battery",     Icon: BatteryCharging,   bg: "#166534" },
  key:        { label: "Ignition key",    Icon: KeyRound,          bg: "#854d0e" },
  // Sayings
  p1:         { label: "P1",              text: "P1",              bg: "#dc2626" },
  drs:        { label: "DRS",             text: "DRS",             bg: "#16a34a" },
  boxbox:     { label: "Box box",         text: "BOX BOX",         bg: "#2563eb" },
  pit:        { label: "Pit stop",        text: "PIT",             bg: "#4b5563" },
  vroom:      { label: "Vroom",           text: "VROOM",           bg: "#db2777" },
  sendit:     { label: "Send it",         text: "SEND IT",         bg: "#9333ea" },
};

/**
 * The white symbol (or saying) for a preset, sized to `px`. Sayings shrink
 * their text to fit the disc.
 */
export function PresetGlyph({ preset, px, className }: { preset: AvatarPreset; px: number; className?: string }) {
  if (preset.text) {
    const words = preset.text.split(" ");
    const longest = Math.max(...words.map((w) => w.length));
    const fontPx = Math.max(6, Math.round((px * 1.55) / Math.max(longest, 2)));
    return (
      <span
        className={cn("block text-center font-heading font-black leading-[0.9] tracking-tight text-white", className)}
        style={{ fontSize: fontPx }}
        aria-hidden
      >
        {words.map((w, i) => (
          <span key={i} className="block">
            {w}
          </span>
        ))}
      </span>
    );
  }
  const Icon = preset.Icon!;
  return <Icon style={{ width: px, height: px }} className={cn("text-white", className)} aria-hidden />;
}
