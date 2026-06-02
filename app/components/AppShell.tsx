"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flag, BarChart2, Users, ShieldCheck, ChevronLeft, ChevronRight, CircleUser } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import { useLeague } from "@/app/context/LeagueContext";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SidebarContent } from "@/app/components/SidebarContent";
import Header from "@/app/components/Header";
import { TabBar } from "@/app/components/TabBar";

const SIDEBAR_COLLAPSED_KEY = "racee_sidebar_collapsed";

const BASE_NAV = [
  { href: "/predict",  label: "Predict",   Icon: Flag },
  { href: "/view",     label: "Standings",  Icon: BarChart2 },
  { href: "/teams",    label: "Teams",      Icon: Users },
] as const;

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function DesktopSidebar() {
  const { user, isAdmin } = useUser();
  const { leagues, activeLeagueId, setActiveLeagueId } = useLeague();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const nav = [
    ...BASE_NAV,
    ...(isAdmin ? [{ href: "/admin", label: "Admin", Icon: ShieldCheck } as const] : []),
  ];

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col shrink-0 border-r border-border bg-card overflow-y-auto transition-[width] duration-200",
        collapsed ? "w-[56px]" : "w-[280px]"
      )}
    >
      {collapsed ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Leagues — initials */}
          {leagues.length > 0 && (
            <div className="px-2 py-4 border-b border-border space-y-1 shrink-0">
              {leagues.map((league) => {
                const isActive = league.id === activeLeagueId;
                return (
                  <Tooltip key={league.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveLeagueId(league.id)}
                        className={cn(
                          "w-full flex items-center justify-center h-10 rounded-sm transition-colors text-xs font-bold",
                          isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-subtle"
                        )}
                      >
                        {initials(league.name)}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{league.name}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          )}

          {/* Nav — icons, flex-1 pushes user to bottom */}
          <nav className="px-2 py-4 space-y-1 flex-1">
            {nav.map(({ href, label, Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center justify-center h-10 rounded-sm transition-colors",
                        active ? "text-primary bg-subtle" : "text-muted-foreground hover:text-foreground hover:bg-subtle"
                      )}
                    >
                      <Icon className="size-5" fill={active ? "currentColor" : "none"} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          {/* User — icon, pinned to bottom */}
          <div className="px-2 py-2 border-t border-border shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/profile" className="w-full flex items-center justify-center h-10 rounded-sm text-muted-foreground hover:text-foreground hover:bg-subtle transition-colors">
                  <CircleUser className="size-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{user?.name ?? "Profile"}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      ) : (
        <SidebarContent />
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className={cn(
          "shrink-0 flex items-center border-t border-border text-muted-foreground hover:text-foreground hover:bg-subtle transition-colors h-12",
          collapsed ? "justify-center px-2" : "gap-2 px-5"
        )}
      >
        {collapsed ? (
          <ChevronRight className="size-4" />
        ) : (
          <>
            <ChevronLeft className="size-4" />
            <span className="text-xs font-medium">Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden lg:justify-center">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        <div className="lg:hidden">
          <TabBar />
        </div>
      </div>
    </div>
  );
}
