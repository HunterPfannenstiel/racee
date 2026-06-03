"use client";

import Link from "next/link";
import { useUser } from "@/app/context/UserContext";

export function SignInCTA() {
  const { user, isLoading } = useUser();
  if (isLoading || user) return null;

  return (
    <div className="pt-12">
      <Link
        href="/signin"
        className="flex items-center justify-center w-full h-12 rounded-md bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-[0.08em] hover:opacity-90 transition-opacity"
      >
        Sign In
      </Link>
    </div>
  );
}
