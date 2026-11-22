"use client";

import { useEffect, useRef, useState } from "react";
import type { TaskEvent } from "@7even/core";
import { createClient } from "@/lib/supabase/client";

const icon: Record<string, string> = {
  status: "◆",
  thought: "·",
  tool: "⚙",
  output: "→",
  error: "!",
  artifact: "▣",
  approval: "⚠",
};

/**
 * Subscribes to the task's event stream. Realtime handles the push; a 4s poll
 * catches anything missed when the socket drops (it happens on phones).
 */
export function TaskLive({
  taskId,
  initial,
  live,
}: {
  taskId: string;
  initial: TaskEvent[];
  live: boolean;
}) {
  const [events, setEvents] = useState<TaskEvent[]>(initial);
  const [connected, setConnected] = useState(false);
  const bottom = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`task-${taskId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "task_events", filter: `task_id=eq.${taskId}` },
        (payload) => {
          const next = payload.new as TaskEvent;
          setEvents((prev) => (prev.some((e) => e.id === next.id) ? prev : [...prev, next]));
        },
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    let cancelled = false;
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("task_events")
        .select("*")
        .eq("task_id", taskId)
        .order("id");
      if (!cancelled && data) setEvents(data as TaskEvent[]);
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [taskId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [events.length]);

  return (
    <section className="overflow-hidden rounded-xl border border-line">
      <header className="flex items-center justify-between border-b border-line bg-soft px-5 py-3.5">
        <h2 className="text-sm font-medium">Live log</h2>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-mute">
          <span
            className={`size-1.5 rounded-full ${
              connected ? "bg-signal live-dot" : live ? "bg-amber-400" : "bg-white/20"
            }`}
          />
          {connected ? "live" : live ? "polling" : "finished"}
        </span>
      </header>

      <div className="max-h-[420px] overflow-y-auto px-5 py-4">
        {events.length === 0 ? (
          <p className="text-xs text-white/30">
            Nothing yet. The bridge writes here as soon as it picks the task up.
          </p>
        ) : (
          <ol className="space-y-2.5">
            {events.map((event) => (
              <li key={event.id} className="flex gap-3 text-[13px] leading-relaxed">
                <span
                  className={`w-3 shrink-0 text-center ${
                    event.kind === "error"
                      ? "text-rose-400"
                      : event.kind === "tool"
                        ? "text-sky-300"
                        : event.kind === "approval"
                          ? "text-amber-300"
                          : "text-white/30"
                  }`}
                >
                  {icon[event.kind] ?? "·"}
                </span>
                <span className="min-w-0 flex-1">
                  {event.kind === "tool" ? (
                    <span className="text-sky-200/80">ran {event.body}</span>
                  ) : (
                    <span className="whitespace-pre-wrap text-white/75">{event.body}</span>
                  )}
                </span>
                <time className="shrink-0 text-[10px] text-white/20">
                  {new Date(event.created_at).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </time>
              </li>
            ))}
          </ol>
        )}
        <div ref={bottom} />
      </div>
    </section>
  );
}
