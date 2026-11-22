import type { Business } from "@7even/core";
import { createClient } from "@/lib/supabase/server";
import { Empty, PageHeader, Panel, relativeTime } from "@/lib/ui";
import { ScheduleForm, ScheduleToggle } from "./ScheduleForm";

export const dynamic = "force-dynamic";

type Schedule = {
  id: string;
  name: string;
  prompt: string;
  cron: string;
  enabled: boolean;
  business_id: string | null;
  last_run_at: string | null;
  next_run_at: string | null;
};

export default async function SchedulesPage() {
  const supabase = await createClient();
  const [schedules, businesses] = await Promise.all([
    supabase.from("schedules").select("*").order("created_at", { ascending: false }),
    supabase.from("businesses").select("id, name"),
  ]);

  const rows = (schedules.data as Schedule[]) ?? [];
  const options = ((businesses.data as Pick<Business, "id" | "name">[]) ?? []).map((b) => ({
    id: b.id,
    name: b.name,
  }));
  const businessName = (id: string | null) => options.find((b) => b.id === id)?.name ?? "General";

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Recurring"
        title="Schedules"
        description="Recurring checks the bridge turns into tasks. Daily triage, weekly audits, month-end close."
      />

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Panel title={`Schedules (${rows.length})`}>
          {rows.length === 0 ? (
            <Empty text="Nothing recurring yet. Add one and it will run on its cron, on your Mac." />
          ) : (
            <ul className="divide-y divide-line">
              {rows.map((schedule) => (
                <li key={schedule.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{schedule.name}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-white/30">
                        {schedule.cron} · {businessName(schedule.business_id)}
                      </p>
                    </div>
                    <ScheduleToggle id={schedule.id} enabled={schedule.enabled} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-mute">
                    {schedule.prompt}
                  </p>
                  <p className="mt-2 text-[10px] text-white/25">
                    last run {relativeTime(schedule.last_run_at)} · next{" "}
                    {schedule.next_run_at
                      ? new Date(schedule.next_run_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "not scheduled"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <ScheduleForm businesses={options} />
      </div>
    </div>
  );
}
