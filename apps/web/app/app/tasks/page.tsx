import Link from "next/link";
import type { Business, Task, TaskStatus } from "@7even/core";
import { createClient } from "@/lib/supabase/server";
import { Empty, PageHeader, StatusPill, relativeTime } from "@/lib/ui";

export const dynamic = "force-dynamic";

const FILTERS: { key: string; label: string; statuses: TaskStatus[] | null }[] = [
  { key: "all", label: "All", statuses: null },
  { key: "active", label: "Active", statuses: ["queued", "claimed", "running"] },
  { key: "approval", label: "Needs you", statuses: ["waiting_approval"] },
  { key: "done", label: "Done", statuses: ["done"] },
  { key: "failed", label: "Failed", statuses: ["failed", "cancelled"] },
];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];

  const supabase = await createClient();
  const [tasksQuery, businesses] = await Promise.all([
    (() => {
      let query = supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(120);
      if (active.statuses) query = query.in("status", active.statuses);
      return query;
    })(),
    supabase.from("businesses").select("id, name"),
  ]);

  const tasks = (tasksQuery.data as Task[]) ?? [];
  const businessName = (id: string | null) =>
    ((businesses.data as Pick<Business, "id" | "name">[]) ?? []).find((b) => b.id === id)?.name ??
    "General";

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Work"
        title="Queue"
        description="Every task, whether it came from you, a schedule, or another agent over A2A."
      />

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/app/tasks?filter=${f.key}`}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              f.key === active.key
                ? "bg-signal text-ink"
                : "border border-line text-mute hover:bg-white/5 hover:text-white"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-line">
        {tasks.length === 0 ? (
          <Empty text="Nothing in this view yet." />
        ) : (
          <ul className="divide-y divide-line">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/app/tasks/${task.id}`}
                  className="flex items-start gap-4 px-5 py-4 transition hover:bg-white/[0.02]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{task.title ?? task.prompt}</p>
                    <p className="mt-1 truncate text-xs text-mute">
                      {businessName(task.business_id)} ·{" "}
                      {task.source === "a2a" && task.origin_agent
                        ? `from ${task.origin_agent}`
                        : task.source}{" "}
                      · {relativeTime(task.created_at)}
                    </p>
                  </div>
                  <StatusPill status={task.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
