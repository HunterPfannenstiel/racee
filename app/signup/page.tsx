"use client";

import { useEffect, useState } from "react";
import { type User, type Team, type Participants } from "@/lib/schemas";
import { useUser } from "@/app/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SignupPage() {
  const { user, setUser, clearUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [newUserName, setNewUserName] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [addingMemberToTeamId, setAddingMemberToTeamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/participants")
      .then((res) => res.json())
      .then((data: Participants) => {
        setUsers(data.users);
        setTeams(data.teams);
      });
  }, []);

  async function save(newUsers: User[], newTeams: Team[]) {
    try {
      const res = await fetch("/api/participants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: newUsers, teams: newTeams }),
      });
      if (!res.ok) setError("Failed to save. Please try again.");
    } catch {
      setError("Failed to save. Please try again.");
    }
  }

  function addUser() {
    const name = newUserName.trim();
    if (!name) return;
    const newUser = { id: crypto.randomUUID(), name };
    const newUsers = [...users, newUser];
    setUsers(newUsers);
    setUser(newUser);
    setNewUserName("");
    save(newUsers, teams);
  }

  function removeUser(id: string) {
    if (user?.id === id) clearUser();
    const newUsers = users.filter((u) => u.id !== id);
    const newTeams = teams.map((t) => ({ ...t, memberIds: t.memberIds.filter((mid) => mid !== id) }));
    setUsers(newUsers);
    setTeams(newTeams);
    save(newUsers, newTeams);
  }

  function addTeam() {
    const name = newTeamName.trim();
    if (!name) return;
    const newTeams = [...teams, { id: crypto.randomUUID(), name, memberIds: [] }];
    setTeams(newTeams);
    setNewTeamName("");
    save(users, newTeams);
  }

  function removeTeam(id: string) {
    const newTeams = teams.filter((t) => t.id !== id);
    setTeams(newTeams);
    save(users, newTeams);
  }

  function addMember(teamId: string, userId: string) {
    const newTeams = teams.map((t) =>
      t.id === teamId ? { ...t, memberIds: [...t.memberIds, userId] } : t
    );
    setTeams(newTeams);
    setAddingMemberToTeamId(null);
    save(users, newTeams);
  }

  function removeMember(teamId: string, userId: string) {
    const newTeams = teams.map((t) =>
      t.id === teamId ? { ...t, memberIds: t.memberIds.filter((mid) => mid !== userId) } : t
    );
    setTeams(newTeams);
    save(users, newTeams);
  }

  return (
    <main className="max-w-lg mx-auto p-6 space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>✕</Button>
          </AlertDescription>
        </Alert>
      )}

      <h1 className="text-2xl font-bold">Sign Up</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Who are you?</h2>
        <Select
          value={user?.id ?? ""}
          onValueChange={(v) => {
            const selected = users.find((u) => u.id === v);
            if (selected) setUser(selected);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select your name" />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Users</h2>
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between">
              <span>{u.name}</span>
              <Button variant="ghost" size="sm" onClick={() => removeUser(u.id)}>Remove</Button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addUser()}
            placeholder="Name"
          />
          <Button variant="outline" onClick={addUser}>Add user</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Teams</h2>
        <div className="space-y-4">
          {teams.map((team) => {
            const nonMembers = users.filter((u) => !team.memberIds.includes(u.id));
            return (
              <div key={team.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{team.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeTeam(team.id)}>Remove team</Button>
                </div>
                <ul className="space-y-1">
                  {team.memberIds.map((mid) => {
                    const u = users.find((u) => u.id === mid);
                    if (!u) return null;
                    return (
                      <li key={mid} className="flex items-center justify-between text-sm">
                        <span>{u.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeMember(team.id, mid)}>Remove</Button>
                      </li>
                    );
                  })}
                </ul>
                {addingMemberToTeamId === team.id ? (
                  <div className="flex gap-2">
                    <Select onValueChange={(v) => v && addMember(team.id, v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {nonMembers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => setAddingMemberToTeamId(null)}>Cancel</Button>
                  </div>
                ) : (
                  nonMembers.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setAddingMemberToTeamId(team.id)}>
                      Add member
                    </Button>
                  )
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Input
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTeam()}
            placeholder="Team name"
          />
          <Button variant="outline" onClick={addTeam}>Create team</Button>
        </div>
      </section>
    </main>
  );
}
