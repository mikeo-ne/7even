"use client";

import { useActionState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { createSchedule, toggleSchedule, type ActionState } from "../actions";

const input =
  "w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-signal/60 focus:ring-2 focus:ring-signal/15";

export function ScheduleToggle({ id, enabled }: { id: string; enabled: boolean }) {
  return (
    <form action={toggleSchedule}>
      <input type="hidden" name="schedule_id" value={id} />
      <input type="hidden" name="enabled" value={String(!enabled)} />
      <button
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          enabled ? "bg-signal" : "bg-white/15"
        }`}
        title={enabled ? "Pause" : "Resume"}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-ink transition-all ${
            enabled ? "left-[18px]" : "left-0.5"
          }`}
        />
      </button>
    </form>
  );
}

export function ScheduleForm({ businesses }: { businesses: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createSchedule, undefined);

  return (
    <div className="h-fit rounded-xl border border-line bg-soft p-5">
      <div className="flex items-center gap-2">
        <CalendarClock className="size-4 text-signal" />
        <h2 className="text-sm font-medium">New schedule</h2>
      </div>
      <p className="mt-1.5 text-xs text-mute">
        Standard 5-field cron. The bridge checks every 30 seconds while it is running.
      </p>

      <form action={formAction} className="mt-4 space-y-3.5">
        <label className="block">
          <span className="mb-1.5 block text-xs text-mute">Name</span>
          <input name="name" required placeholder="Daily inbox triage" className={input} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs text-mute">What to do</span>
          <textarea
            name="prompt"
            rows={4}
            required
            placeholder="Go through today's unread mail, draft replies for anything routine, and list anything that needs my decision."
            className={`${input} resize-none`}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs text-mute">Cron</span>
            <input name="cron" required defaultValue="0 8 * * *" className={`${input} font-mono`} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-mute">Business</span>
            <select name="business_id" defaultValue={businesses[0]?.id ?? ""} className={input}>
              <option value="">General</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            ["Daily 08:00", "0 8 * * *"],
            ["Weekdays 07:30", "30 7 * * 1-5"],
            ["Mondays 09:00", "0 9 * * 1"],
            ["Month-end 18:00", "0 18 28-31 * *"],
          ].map(([label, cron]) => (
            <span
              key={cron}
              className="rounded-full border border-line px-2.5 py-1 text-[10px] text-white/45"
            >
              {label} · <code className="text-white/60">{cron}</code>
            </span>
          ))}
        </div>

        {state?.error && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {state.error}
          </p>
        )}
        {state?.ok && (
          <p className="rounded-lg border border-signal/30 bg-signal/10 px-3 py-2 text-xs text-signal">
            {state.ok}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-signal px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-signal-dim disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          Create schedule
        </button>
      </form>
    </div>
  );
}
