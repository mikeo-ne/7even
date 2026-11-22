import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, CheckCircle2, Inbox, Layers, LogOut, Megaphone, Network } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { NavLink } from "./NavLink";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [pendingApprovals, runningTasks, agent] = await Promise.all([
    supabase
      .from("approvals")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("status", "pending"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .in("status", ["claimed", "running"]),
    supabase
      .from("agents")
      .select("name, status, last_seen_at")
      .eq("owner_id", user.id)
      .order("last_seen_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const approvals = pendingApprovals.count ?? 0;
  const busy = runningTasks.count ?? 0;
  const bridge = agent.data;
  const online = bridge?.status === "online" || bridge?.status === "busy";

  const nav = [
    { href: "/app", label: "Overview", icon: Layers },
    { href: "/app/tasks", label: "Queue", icon: Inbox, badge: busy || undefined },
    { href: "/app/approvals", label: "Approvals", icon: CheckCircle2, badge: approvals || undefined },
    { href: "/app/social", label: "Social", icon: Megaphone },
    { href: "/app/businesses", label: "Businesses", icon: Layers },
    { href: "/app/agents", label: "Agents", icon: Network },
    { href: "/app/schedules", label: "Schedules", icon: CalendarClock },
  ];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="flex flex-col justify-between border-line lg:sticky lg:top-0 lg:h-screen lg:border-r">
        <div>
          <Link href="/app" className="flex items-center gap-2.5 px-5 py-5">
            <span className="grid size-8 place-items-center rounded-lg bg-signal text-[13px] font-black text-ink">
              7
            </span>
            <span className="text-base font-semibold tracking-tight">7even</span>
          </Link>

          <div className="mx-3 mb-4 rounded-lg border border-line bg-soft px-3.5 py-3">
            <div className="flex items-center gap-2">
              <span
                className={`size-1.5 rounded-full ${online ? "live-dot bg-signal" : "bg-white/25"}`}
              />
              <p className="truncate text-xs font-medium">
                {bridge?.name ?? "No bridge yet"}
              </p>
            </div>
            <p className="mt-1 text-[11px] text-mute">
              {online ? `${bridge?.status} · your Mac` : "offline — start the bridge"}
            </p>
          </div>

          <nav className="flex gap-1 overflow-x-auto px-3 lg:block lg:space-y-0.5">
            {nav.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-4">
          <span className="truncate text-xs text-mute">{user.email}</span>
          <form action={signOut}>
            <button
              type="submit"
              title="Sign out"
              className="grid size-8 place-items-center rounded-lg text-mute transition hover:bg-white/5 hover:text-white"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 border-t border-line lg:border-t-0">
        <div className="mx-auto max-w-5xl px-6 py-8 sm:py-10">{children}</div>
      </main>
    </div>
  );
}
