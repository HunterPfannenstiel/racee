"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/server/auth/auth-client";
import { useUser } from "@/app/context/UserContext";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const NAV = [
  { href: "/predict", label: "Predict" },
  { href: "/view",    label: "Standings" },
  { href: "/teams",   label: "Teams" },
];

export default function Header() {
  const { user, isAdmin, isLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  const navLinks = [
    ...NAV,
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="border-b-2 border-primary bg-card">
      <div className="max-w-5xl mx-auto px-6 h-14 grid grid-cols-3 items-center sm:flex sm:justify-between sm:gap-8">

        {/* Hamburger — mobile left col; hidden on desktop */}
        <button
          className="sm:hidden text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        {/* Logo — centered in middle col on mobile; leftmost on desktop */}
        <Link
          href="/"
          className="text-sm font-bold tracking-widest uppercase text-foreground justify-self-center sm:justify-self-auto"
        >
          Racee
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-sm transition-colors",
                pathname.startsWith(href)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* User dropdown — right col on mobile; rightmost on desktop */}
        <div className="flex justify-end text-sm font-medium">
          {isLoading ? (
            <span className="text-muted-foreground/40 flex items-center gap-1.5">
              <span className="text-primary/40">◉</span> ···
            </span>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <span className="text-primary">◉</span> {user.name}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/account">Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${user.id}`}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/commissioner">Commissioner</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { signOut(); router.push("/"); }}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/signin" className="text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
          )}
        </div>

      </div>

      {/* Mobile nav drawer */}
      <Drawer open={navOpen} onOpenChange={setNavOpen} direction="left">
        <DrawerContent className="p-6 space-y-1">
          {navLinks.map(({ href, label }) => (
            <DrawerClose key={href} asChild>
              <Link
                href={href}
                className={cn(
                  "block px-3 py-2 text-sm font-medium rounded-sm transition-colors",
                  pathname.startsWith(href)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </Link>
            </DrawerClose>
          ))}
        </DrawerContent>
      </Drawer>
    </header>
  );
}
