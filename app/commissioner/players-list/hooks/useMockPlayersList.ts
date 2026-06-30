"use client";

import { useState } from "react";

export type PendingPlayer = {
  id: string;
  name: string;
};

export type Member = {
  id: string;
  name: string;
};

const MOCK_PENDING: PendingPlayer[] = [
  { id: "p-1", name: "Max Verstappen" },
  { id: "p-2", name: "Fernando Alonso" },
];

const MOCK_MEMBERS: Member[] = [
  { id: "m-1", name: "Lewis Hamilton" },
  { id: "m-2", name: "Lando Norris" },
  { id: "m-3", name: "Carlos Sainz" },
];

export function useMockPlayersList() {
  const [pending, setPending] = useState<PendingPlayer[]>(MOCK_PENDING);
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);

  function accept(id: string) {
    const player = pending.find((p) => p.id === id);
    if (!player) return;
    setPending((prev) => prev.filter((p) => p.id !== id));
    setMembers((prev) => [...prev, { id: player.id, name: player.name }]);
  }

  function deny(id: string) {
    setPending((prev) => prev.filter((p) => p.id !== id));
  }

  return { pending, members, accept, deny };
}
