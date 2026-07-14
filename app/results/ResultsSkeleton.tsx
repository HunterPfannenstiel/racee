import { Skeleton } from "@/components/ui/skeleton";
import { PLATFORM_HEIGHT } from "./Podium";

const PLATFORM_ORDER = [2, 1, 3] as const;

export function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end gap-2 px-4">
        {PLATFORM_ORDER.map((rank) => (
          <div key={rank} className="flex flex-1 flex-col items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className={`w-full rounded-t-lg ${PLATFORM_HEIGHT[rank]}`} />
          </div>
        ))}
      </div>

      <div className="mx-4 rounded-lg border border-border bg-surface overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-[56px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
          >
            <Skeleton className="h-4 w-6 shrink-0" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 w-10 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
