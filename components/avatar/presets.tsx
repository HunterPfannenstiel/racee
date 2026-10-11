import {
  CarFront, Crown, Flag, Flame, Fuel, Gauge, Ghost, Medal, Mountain, Rocket,
  Shield, Skull, Star, Swords, Target, Timer, Trophy, Wind, Wrench, Zap,
  type LucideIcon,
} from "lucide-react";
import type { AvatarPresetId } from "@/lib/avatar";

/** The 20 built-in profile icons: a symbol on a colored disc. */
export const AVATAR_PRESETS: Record<AvatarPresetId, { label: string; Icon: LucideIcon; bg: string }> = {
  flag:     { label: "Checkered flag", Icon: Flag,     bg: "#1f2937" },
  trophy:   { label: "Trophy",         Icon: Trophy,   bg: "#b45309" },
  car:      { label: "Race car",       Icon: CarFront, bg: "#b91c1c" },
  gauge:    { label: "Speedometer",    Icon: Gauge,    bg: "#0f766e" },
  bolt:     { label: "Lightning",      Icon: Zap,      bg: "#ca8a04" },
  flame:    { label: "Flame",          Icon: Flame,    bg: "#c2410c" },
  crown:    { label: "Crown",          Icon: Crown,    bg: "#7e22ce" },
  rocket:   { label: "Rocket",         Icon: Rocket,   bg: "#1d4ed8" },
  medal:    { label: "Medal",          Icon: Medal,    bg: "#a16207" },
  timer:    { label: "Stopwatch",      Icon: Timer,    bg: "#0369a1" },
  wrench:   { label: "Wrench",         Icon: Wrench,   bg: "#475569" },
  fuel:     { label: "Fuel",           Icon: Fuel,     bg: "#15803d" },
  star:     { label: "Star",           Icon: Star,     bg: "#be185d" },
  shield:   { label: "Shield",         Icon: Shield,   bg: "#334155" },
  skull:    { label: "Skull",          Icon: Skull,    bg: "#18181b" },
  ghost:    { label: "Ghost",          Icon: Ghost,    bg: "#6d28d9" },
  mountain: { label: "Mountain",       Icon: Mountain, bg: "#166534" },
  wind:     { label: "Wind",           Icon: Wind,     bg: "#0e7490" },
  target:   { label: "Target",         Icon: Target,   bg: "#9f1239" },
  swords:   { label: "Swords",         Icon: Swords,   bg: "#57534e" },
};
