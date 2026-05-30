"use client";
import { createContext, useContext } from "react";
import { useSession } from "@/server/auth/auth-client";
import { type User } from "@/lib/schemas";

type UserContextValue = {
  user: User | null;
  isAdmin: boolean;
};

const UserContext = createContext<UserContextValue>({ user: null, isAdmin: false });

export function UserContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  const user: User | null = session?.user
    ? { id: session.user.id, name: session.user.name }
    : null;

  const isAdmin = session?.user?.isAdmin ?? false;

  return <UserContext.Provider value={{ user, isAdmin }}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
