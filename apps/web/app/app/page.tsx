import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Inbox, Network, Plus } from "lucide-react";
import type { Business, Task } from "@7even/core";
import { createClient } from "@/lib/supabase/server";
import { Empty, PageHeader, Panel, StatusPill, relativeTime } from "@/lib/ui";
import { QueueForm } from "./QueueForm";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [businesses, tasks, approvals, agent] = await Promise.all([
    supabase.from("businesses").select("*").order("created_at"),
    supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(8),
    supabase.from("approvals").select("*").eq("status", "pending").order("created_at").limit(4),
    supabase.from("agents").select("*").order("last_seen_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const list = (businesses.data as Business[]) ?? [];
  const recent = (tasks.data as Task[]) ?? [];
  const waiting = approvals.data ?? [];
  const bridge = agent.data;
  const online = bridge?.status === "online" || bridge?.status === "busy";

  const businessName = (id: string | null) => list.find((b) => b.id === id)?.name ?? "General";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Control room"
        title={`Good to see you${user?.email ? `, ${user.email.split("@")[0]}` : ""}`}
        description="Queue work here. Your Mac executes it and reports back."
        action={
          <Link
            href="/app/businesses"
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:bg-white/5"
          >
            <Plus className="size-4" />
            Add business
          </Link>
        }
      />

      <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
        {[
          {
            label: "Bridge",
            value: bridge ? (online ? "Online" : "Offline") : "Not connected",
            hint: bridge ? `${bridge.name} · ${relativeTime(bridge.last_seen_at)}` : "run `7even start` on your Mac",
            icon: Network,
          },
          {
            label: "In flight",
            value: String(recent.filter((t) => ["queued", "claimed", "running"].includes(t.status)).length),
            hint: `${recent.filter((t) => t.status === "queued").length} waiting on the Mac`,
            icon: Inbox,
          },
          {
            label: "Needs you",
            value: String(waiting.length),
            hint: waiting.length ? "approvals blocking work" : "nothing to decide",
            icon: CheckCircle2,
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-soft p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-mute">{stat.label}</span>
              <stat.icon className="size-4 text-signal/70" strokeWidth={1.75} />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{stat.value}</p>
            <p className="mt-1 text-[11px] text-white/30">{stat.hint}</p>
          </div>
        ))}
      </div>

      <QueueForm businesses={list.map((b) => ({ id: b.id, name: b.name }))} />

      {waiting.length > 0 && (
        <Panel
          title="Waiting on you"
          meta={
            <Link href="/app/approvals" className="text-xs text-signal hover:text-signal-dim">
              All approvals
            </Link>
          }
        >
          <ul className="divide-y divide-line">
            {waiting.map((approval) => (
              <li key={approval.id} className="px-5 py-4">
                <p className="text-sm">{approval.action}</p>
                {approval.detail && (
                  <p className="mt-1 line-clamp-2 text-xs text-mute">{approval.detail}</p>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel
        title="Recent activity"
        meta={
          <Link href="/app/tasks" className="inline-flex items-center gap-1 text-xs text-mute transition hover:text-signal">
            Queue <ArrowUpRight className="size-3.5" />
          </Link>
        }
      >
        {recent.length === 0 ? (
          <Empty text="Nothing has run yet. Queue a task above and start the bridge on your Mac." />
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/app/tasks/${task.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-white/[0.02]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{task.title ?? task.prompt}</p>
                    <p className="truncate text-xs text-mute">
                      {businessName(task.business_id)} · {task.source} · {relativeTime(task.created_at)}
                    </p>
                  </div>
                  <StatusPill status={task.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Businesses"
        meta={
          <Link href="/app/businesses" className="text-xs text-mute transition hover:text-signal">
            Manage
          </Link>
        }
      >
        {list.length === 0 ? (
          <Empty
            text="No businesses yet. Add one and the agent gets its own workspace folder for it."
            action={
              <Link
                href="/app/businesses"
                className="rounded-full bg-signal px-4 py-2 text-xs font-semibold text-ink transition hover:bg-signal-dim"
              >
                Add your first business
              </Link>
            }
          />
        ) : (
          <ul className="grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0 sm:[&>li:nth-child(-n+2)]:border-t-0">
            {list.map((business) => (
              <li key={business.id} className="border-line px-5 py-4 sm:border-t sm:odd:border-r">
                <div className="flex items-center gap-2.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: business.colour }}
                  />
                  <p className="truncate text-sm font-medium">{business.name}</p>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-mute">
                  {business.brief || "No brief — the agent will ask when it needs context."}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
