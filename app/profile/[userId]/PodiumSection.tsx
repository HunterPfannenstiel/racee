import { type Racer } from "@/lib/schemas";
import { Card } from "@/components/ui/card";
import { RacerAvatar } from "@/components/RacerAvatar";
import { cn } from "@/lib/utils";

const POSITION_COLOR: Record<number, string> = {
  1: "text-yellow-500",
  2: "text-slate-400",
  3: "text-amber-600",
};

type PodiumCardProps = {
  racerId: string;
  position: number;
  racersById: Record<string, Racer>;
  driverPoints: Record<string, number> | null;
  className?: string;
};

function PodiumCard({ racerId, position, racersById, driverPoints, className }: PodiumCardProps) {
  const racer = racersById[racerId];
  const points = driverPoints?.[racerId];
  return (
    <Card className={cn("flex flex-col items-center justify-end gap-3 px-4 pb-4", className)}>
      <RacerAvatar name={racer?.name ?? "?"} image={racer?.image} className="w-14 h-14" />
      <div className="text-center space-y-0.5">
        <p className="text-sm font-semibold leading-tight">{racer?.name ?? "Unknown"}</p>
        <p className="text-xs text-muted-foreground">{racer?.team ?? ""}</p>
      </div>
      {points !== undefined && (
        <p className="text-xs font-mono tabular-nums text-green-600 dark:text-green-400">{points} pts</p>
      )}
      <span className={cn("text-xs font-bold tracking-widest uppercase", POSITION_COLOR[position])}>
        P{position}
      </span>
    </Card>
  );
}

type Props = {
  top3: string[];
  racersById: Record<string, Racer>;
  driverPoints: Record<string, number> | null;
};

export function PodiumSection({ top3, racersById, driverPoints }: Props) {
  const [p1Id, p2Id, p3Id] = top3;

  return (
    <>
      {/* Mobile: P1 prominent on top, P2+P3 below */}
      <div className="flex flex-col gap-3 sm:hidden">
        <PodiumCard racerId={p1Id} position={1} racersById={racersById} driverPoints={driverPoints} />
        <div className="grid grid-cols-2 gap-3">
          <PodiumCard racerId={p2Id} position={2} racersById={racersById} driverPoints={driverPoints} />
          <PodiumCard racerId={p3Id} position={3} racersById={racersById} driverPoints={driverPoints} />
        </div>
      </div>

      {/* Desktop: P2, P1 (tallest/elevated), P3 */}
      <div className="hidden sm:flex items-end gap-3">
        <PodiumCard racerId={p2Id} position={2} racersById={racersById} driverPoints={driverPoints} className="flex-1 min-h-36" />
        <PodiumCard racerId={p1Id} position={1} racersById={racersById} driverPoints={driverPoints} className="flex-1 min-h-48" />
        <PodiumCard racerId={p3Id} position={3} racersById={racersById} driverPoints={driverPoints} className="flex-1 min-h-32" />
      </div>
    </>
  );
}
