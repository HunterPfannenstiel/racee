"use client";

import Link from "next/link";
import { useUser } from "@/app/context/UserContext";

export default function Header() {
  const { user } = useUser();

  return (
    <header>
      {user ? (
        <span>
          Signed in as {user.name} · <Link href="/signup">Switch</Link>
        </span>
      ) : (
        <Link href="/signup">Sign in</Link>
      )}
    </header>
  );
}
