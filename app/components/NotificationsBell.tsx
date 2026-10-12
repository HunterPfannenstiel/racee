"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { useUser } from "@/app/context/UserContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const timeAgo = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
};

/** Bell in the header with an unread count; opening it lists notifications and marks them read. */
export function NotificationsBell() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const listQuery = useQuery(
    orpc.me.notifications.list.queryOptions({ enabled: !!user, refetchInterval: 60_000, refetchOnWindowFocus: true }),
  );
  const markRead = useMutation(
    orpc.me.notifications.markRead.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.me.notifications.list.key() }),
    }),
  );
  if (!user) return null;

  const unread = listQuery.data?.unreadCount ?? 0;
  const notifications = listQuery.data?.notifications ?? [];

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          if (unread > 0) markRead.mutate({});
        }}
        className="relative shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
          </DialogHeader>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            <ul className="max-h-[60vh] space-y-3 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="rounded-md border border-border p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
