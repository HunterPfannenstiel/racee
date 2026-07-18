import { cn } from "@/lib/utils";

type AnchoredRowProps = {
  start?: React.ReactNode;
  center?: React.ReactNode;
  end?: React.ReactNode;
} & Omit<React.ComponentProps<"div">, "children">;

// auto/1fr/auto so start/end pin to the row's edges and center sizes to the
// remaining space between them -- centering center's content there lands it
// between the anchors, not the row's full width.
export function AnchoredRow({ start, center, end, className, ...props }: AnchoredRowProps) {
  return (
    <div className={cn("grid grid-cols-[auto_1fr_auto] items-center gap-2", className)} {...props}>
      <div className="min-w-0 justify-self-start">{start}</div>
      <div className="min-w-0 justify-self-center">{center}</div>
      <div className="min-w-0 justify-self-end">{end}</div>
    </div>
  );
}
