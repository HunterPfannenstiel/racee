"use client";
import { createContext, useContext, useState } from "react";
import { useSession, refreshSession } from "@/server/auth/auth-client";
import { type User } from "@/lib/schemas";

type UserContextValue = {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  updateName: (name: string) => Promise<void>;
};

const UserContext = createContext<UserContextValue>({
  user: null,
  isAdmin: false,
  isLoading: true,
  updateName: async () => {},
});

export function UserContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [nameOverride, setNameOverride] = useState<string | null>(null);

  const sessionUser = session?.user ?? null;
  const user: User | null = sessionUser
    ? { id: sessionUser.id, name: nameOverride ?? sessionUser.name }
    : null;

  const isAdmin = sessionUser?.isAdmin ?? false;

  async function updateName(name: string) {
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to update name");
    setNameOverride(name);
    refreshSession();
  }

  return (
    <UserContext.Provider value={{ user, isAdmin, isLoading: isPending, updateName }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
