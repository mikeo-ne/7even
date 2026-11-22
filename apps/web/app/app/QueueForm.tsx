"use client";

import { useActionState, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { queueTask, type ActionState } from "./actions";

export function QueueForm({ businesses }: { businesses: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(queueTask, undefined);
  const [prompt, setPrompt] = useState("");

  return (
    <form
      action={(formData) => {
        formAction(formData);
        setPrompt("");
      }}
      className="rounded-xl border border-line bg-soft p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Give the agent something to do</h2>
        <span className="text-[11px] text-mute">
          Runs on your Mac · A2A-safe
        </span>
      </div>

      <textarea
        name="prompt"
        rows={3}
        required
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. Reconcile last month's Spotify statement against our catalogue and flag anything that does not match the release list."
        className="mt-3 w-full resize-none rounded-lg border border-line bg-ink px-3.5 py-3 text-sm placeholder:text-white/25 outline-none transition focus:border-signal/60 focus:ring-2 focus:ring-signal/15"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select
          name="business_id"
          defaultValue={businesses[0]?.id ?? ""}
          className="rounded-lg border border-line bg-ink px-3 py-2 text-xs text-white outline-none focus:border-signal/60"
        >
          <option value="">General (no business)</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink transition hover:bg-signal-dim disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Queue it
        </button>

        {state?.ok && <span className="text-xs text-signal">{state.ok}</span>}
        {state?.error && <span className="text-xs text-rose-300">{state.error}</span>}
      </div>
    </form>
  );
}
