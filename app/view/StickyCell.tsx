"use client";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const COL_WIDTHS = {
  pos:   40,
  name:  144,
  total: 64,
} as const;

const COL_LEFT: Record<keyof typeof COL_WIDTHS, number> = {
  pos:   0,
  name:  COL_WIDTHS.pos,
  total: COL_WIDTHS.pos + COL_WIDTHS.name,
};

type Col = keyof typeof COL_WIDTHS;

type StickyCellProps = {
  col: Col;
  as?: "td" | "th";
  color?: string;
  teamName?: string;
  className?: string;
  children?: React.ReactNode;
};

export function StickyCell({ col, as: Tag = "td", color, teamName, className, children }: StickyCellProps) {
  const isTotal = col === "total";

  return (
    <Tag
      className={cn(
        "relative sticky z-10 bg-background px-2 py-2 text-sm",
        isTotal && "shadow-[2px_0_6px_-2px_rgba(0,0,0,0.3)]",
        Tag === "th" && "text-xs font-semibold uppercase tracking-widest text-muted-foreground",
        className
      )}
      style={{
        left: COL_LEFT[col],
        width: COL_WIDTHS[col],
        minWidth: COL_WIDTHS[col],
      }}
    >
      {color && (
        teamName ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="absolute left-0 top-0 bottom-0 w-1 cursor-default"
                style={{ backgroundColor: color }}
              />
            </TooltipTrigger>
            <TooltipContent side="right">{teamName}</TooltipContent>
          </Tooltip>
        ) : (
          <span
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: color }}
          />
        )
      )}
      {children}
    </Tag>
  );
}
