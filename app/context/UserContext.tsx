"use client";
import { createContext, useContext } from "react";
import { useSession } from "@/server/auth/auth-client";
import { type User } from "@/lib/schemas";

type UserContextValue = {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
};

const UserContext = createContext<UserContextValue>({
  user: null,
  isAdmin: false,
  isLoading: true,
});

export function UserContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  const sessionUser = session?.user ?? null;
  const user: User | null = sessionUser
    ? { id: sessionUser.id, name: sessionUser.name }
    : null;

  const isAdmin = sessionUser?.isAdmin ?? false;

  return (
    <UserContext.Provider value={{ user, isAdmin, isLoading: isPending }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
