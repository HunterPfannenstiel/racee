"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/app/context/UserContext";
import { useLeague } from "@/app/context/LeagueContext";
import { orpc } from "@/lib/orpc/client";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { SidebarContent } from "@/app/components/SidebarContent";

export default function Header() {
  const { user } = useUser();
  const { activeLeagueId } = useLeague();
  const { data: leagues = [] } = useQuery(orpc.leagues.list.queryOptions({ enabled: !!user }));
  const [navOpen, setNavOpen] = useState(false);

  const activeLeague = leagues.find((l) => l.id === activeLeagueId) ?? null;

  return (
    <header className="border-b-2 border-primary bg-card shrink-0">
      <div className="px-4 h-14 flex items-center gap-4">

        <button
          className="lg:hidden text-muted-foreground hover:text-foreground transition-colors shrink-0"
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <div className="flex items-center gap-2 flex-1 justify-center lg:justify-start">
          <Link href="/" className="text-sm font-bold tracking-widest uppercase text-foreground">
            Racee
          </Link>
          {activeLeague && (
            <>
              <span className="text-muted-foreground">|</span>
              <span className="text-sm text-muted-foreground truncate">{activeLeague.name}</span>
            </>
          )}
        </div>

      </div>

      <Drawer open={navOpen} onOpenChange={setNavOpen} direction="left">
        <DrawerContent className="flex flex-col gap-0 p-0">
          <SidebarContent onNavigate={() => setNavOpen(false)} />
        </DrawerContent>
      </Drawer>
    </header>
  );
}
