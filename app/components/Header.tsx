"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/app/context/UserContext";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/predict", label: "Predict" },
  { href: "/view",    label: "Standings" },
  { href: "/teams",   label: "Teams" },
  { href: "/admin",   label: "Admin" },
];

export default function Header() {
  const { user, clearUser } = useUser();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="border-b-2 border-primary bg-card">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-8">

        <Link href="/" className="text-sm font-bold tracking-widest uppercase text-foreground">
          Racee
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label }) => (
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

        <div className="relative text-sm font-medium" ref={ref}>
          {user ? (
            <>
              <button
                onClick={() => setOpen((o) => !o)}
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <span className="text-primary">◉</span> {user.name}
              </button>
              {open && (
                <div className="absolute right-0 mt-1 w-32 rounded-md border border-border bg-card shadow-md z-50">
                  <Link
                    href={`/profile/${user.id}`}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-md"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => { clearUser(); setOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-md"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link href="/signin" className="text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
