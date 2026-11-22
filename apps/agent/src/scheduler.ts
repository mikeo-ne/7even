import cronParser from "cron-parser";
import type { AgentStore } from "./db.js";

type Schedule = {
  id: string;
  owner_id: string;
  business_id: string | null;
  name: string;
  prompt: string;
  cron: string;
  enabled: boolean;
  next_run_at: string | null;
};

/**
 * Turn enabled schedules into queued tasks. Runs on a 30s tick — coarse enough
 * to be cheap, fine enough that "daily at 08:00" is not two minutes late.
 */
export function startScheduler(store: AgentStore): () => void {
  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    const { data } = await store
      .raw()
      .from("schedules")
      .select("*")
      .eq("enabled", true);

    const now = Date.now();

    for (const schedule of (data as Schedule[]) ?? []) {
      const due = !schedule.next_run_at || new Date(schedule.next_run_at).getTime() <= now;
      if (!due) continue;

      await store.createTask({
        ownerId: schedule.owner_id,
        businessId: schedule.business_id,
        title: schedule.name,
        prompt: schedule.prompt,
        source: "schedule",
      });

      let following: string | null = null;
      try {
        following = cronParser.parseExpression(schedule.cron).next().toDate().toISOString();
      } catch {
        following = null; // Bad cron in the db — one run, then it stops rather than spinning.
      }

      await store.touchSchedule(schedule.id, new Date().toISOString(), following);
    }
  };

  const interval = setInterval(() => void tick().catch(() => undefined), 30_000);

  return () => {
    stopped = true;
    clearInterval(interval);
  };
}
