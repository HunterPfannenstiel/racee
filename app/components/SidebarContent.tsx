"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Flag, BarChart2, Users, Gavel, ShieldCheck, CircleUser, ListOrdered } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import { useLeague } from "@/app/context/LeagueContext";
import { orpc } from "@/lib/orpc/client";
import { cn } from "@/lib/utils";

const BASE_NAV = [
  { href: "/predict",       label: "Predict",       Icon: Flag },
  { href: "/results",       label: "Results",       Icon: ListOrdered } as const,
  { href: "/standings",      label: "Standings",      Icon: BarChart2 },
  { href: "/teams",         label: "Teams",          Icon: Users },
  { href: "/commissioner",  label: "Commissioner",   Icon: Gavel },
] as const;

type Props = {
  onNavigate?: () => void;
};

export function SidebarContent({ onNavigate }: Props) {
  const { user, isAdmin } = useUser();
  const { activeLeagueId, setActiveLeagueId } = useLeague();
  const { data: leagues = [] } = useQuery(orpc.leagues.list.queryOptions({ enabled: !!user }));
  const pathname = usePathname();

  const nav = [
    ...BASE_NAV,
    ...(isAdmin ? [{ href: "/admin", label: "Admin", Icon: ShieldCheck } as const] : []),
  ];

  function handleLeagueSelect(id: string) {
    setActiveLeagueId(id);
    onNavigate?.();
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">

      {/* Leagues */}
      {leagues.length > 0 && (
        <div className="px-5 py-4 border-b border-border space-y-1 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Leagues</p>
          {leagues.map((league) => {
            const isActive = league.id === activeLeagueId;
            return (
              <button
                key={league.id}
                onClick={() => handleLeagueSelect(league.id)}
                className={cn(
                  "w-full text-left flex items-center min-h-12 pl-3 pr-4 rounded-sm transition-colors border-l-2 cursor-pointer",
                  isActive
                    ? "border-primary text-foreground bg-subtle"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-subtle"
                )}
              >
                <span className="text-sm font-medium">{league.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Nav — flex-1 pushes user to bottom */}
      <nav className="px-5 py-4 space-y-1 flex-1">
        {user && (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Navigate</p>
            {nav.map(({ href, label, Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 min-h-12 px-3 text-sm font-medium rounded-sm transition-colors border-l-2",
                    active
                      ? "border-primary text-foreground bg-subtle"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-subtle"
                  )}
                >
                  <Icon className="size-4 shrink-0" fill={active ? "currentColor" : "none"} />
                  {label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User — pinned to bottom */}
      <div className="px-3 py-2 border-t border-border shrink-0">
        <Link
          href={user ? "/profile" : "/signin"}
          onClick={onNavigate}
          className="flex items-center gap-2.5 min-h-10 px-3 rounded-sm text-muted-foreground hover:text-foreground hover:bg-subtle transition-colors"
        >
          <CircleUser className="size-4 shrink-0" />
          {user ? (
            <span className="text-sm font-medium truncate">{user.name}</span>
          ) : (
            <span className="text-sm">Sign in</span>
          )}
        </Link>
      </div>

    </div>
  );
}
