"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flag, BarChart2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/predict",  label: "Predict",   Icon: Flag },
  { href: "/standings", label: "Standings",  Icon: BarChart2 },
  { href: "/teams",    label: "Teams",      Icon: Users },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 bg-elevated border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-14">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative cursor-pointer"
            >
              {active && (
                <span className="absolute top-0 inset-x-0 h-0.5 bg-primary" />
              )}
              <Icon
                className={cn("size-5 transition-colors", active ? "text-primary" : "text-muted-foreground")}
                fill={active ? "currentColor" : "none"}
              />
              {active && (
                <span className="text-[10px] font-medium text-primary tracking-wide">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
