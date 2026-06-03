import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui/page-shell";
import { OverhaulNotice } from "@/components/ui/overhaul-notice";
import { CalendarIcon, FlagIcon, UserIcon, KeyRoundIcon, ShieldIcon } from "lucide-react";
import { getSession } from "@/server/auth/server";

const CARDS = [
  {
    href: "/admin/leagues",
    icon: CalendarIcon,
    title: "Leagues",
    description: "Create and manage race leagues.",
  },
  {
    href: "/admin/races",
    icon: FlagIcon,
    title: "Races",
    description: "Add races and configure driver lineups.",
  },
  {
    href: "/admin/drivers",
    icon: UserIcon,
    title: "Drivers",
    description: "Manage the global driver roster.",
  },
  {
    href: "/admin/results",
    icon: KeyRoundIcon,
    title: "Results",
    description: "Set official race finish orders.",
  },
  {
    href: "/admin/users",
    icon: ShieldIcon,
    title: "Users",
    description: "Manage user roles and admin access.",
  },
];

export default async function AdminPage() {
  const session = await getSession();
  if (!session?.user.isAdmin) redirect("/");
  return (
    <PageShell title="Admin">
      <OverhaulNotice />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-sm border border-border bg-card p-5 transition-colors hover:border-primary"
          >
            <div className="flex items-center gap-3">
              <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-semibold tracking-tight">{title}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
