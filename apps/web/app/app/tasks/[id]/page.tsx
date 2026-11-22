import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Approval, Business, Task, TaskEvent } from "@7even/core";
import { createClient } from "@/lib/supabase/server";
import { Panel, StatusPill, relativeTime } from "@/lib/ui";
import { TaskLive } from "./TaskLive";

export const dynamic = "force-dynamic";

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: task } = await supabase.from("tasks").select("*").eq("id", id).maybeSingle();
  if (!task) notFound();

  const [events, approvals, business] = await Promise.all([
    supabase.from("task_events").select("*").eq("task_id", id).order("id"),
    supabase.from("approvals").select("*").eq("task_id", id).order("created_at"),
    task.business_id
      ? supabase.from("businesses").select("*").eq("id", task.business_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const record = task as Task;
  const log = (events.data as TaskEvent[]) ?? [];
  const decisions = (approvals.data as Approval[]) ?? [];
  const biz = (business.data as Business | null) ?? null;
  const live = ["queued", "claimed", "running"].includes(record.status);

  return (
    <div className="space-y-7">
      <Link
        href="/app/tasks"
        className="inline-flex items-center gap-1.5 text-xs text-mute transition hover:text-white"
      >
        <ArrowLeft className="size-3.5" />
        Queue
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight">{record.title ?? "Task"}</h1>
            <StatusPill status={record.status} />
          </div>
          <p className="mt-1.5 text-xs text-mute">
            {biz?.name ?? "General"} · {record.source}
            {record.origin_agent ? ` · from ${record.origin_agent}` : ""} ·{" "}
            {relativeTime(record.created_at)}
          </p>
        </div>
      </div>

      <Panel title="Request">
        <p className="whitespace-pre-wrap px-5 py-4 text-sm leading-relaxed text-white/80">
          {record.prompt}
        </p>
      </Panel>

      <TaskLive taskId={record.id} initial={log} live={live} />

      {record.result && (
        <Panel title="Result">
          <pre className="overflow-x-auto px-5 py-4 text-[13px] leading-relaxed whitespace-pre-wrap text-white/80">
            {record.result}
          </pre>
        </Panel>
      )}

      {record.error && (
        <Panel title="Error">
          <pre className="overflow-x-auto px-5 py-4 text-[13px] leading-relaxed whitespace-pre-wrap text-rose-300">
            {record.error}
          </pre>
        </Panel>
      )}

      {decisions.length > 0 && (
        <Panel title="Approvals">
          <ul className="divide-y divide-line">
            {decisions.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm">{a.action}</p>
                  {a.detail && <p className="mt-1 line-clamp-3 text-xs text-mute">{a.detail}</p>}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset ${
                    a.status === "approved"
                      ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20"
                      : a.status === "rejected"
                        ? "bg-rose-500/10 text-rose-300 ring-rose-500/25"
                        : "bg-amber-400/10 text-amber-300 ring-amber-400/25"
                  }`}
                >
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
