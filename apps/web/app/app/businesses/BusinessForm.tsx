"use client";

import { useActionState } from "react";
import { Loader2, Plus } from "lucide-react";
import { createBusiness, type ActionState } from "../actions";

const input =
  "w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-signal/60 focus:ring-2 focus:ring-signal/15";

const COLOURS = ["#d7ff3e", "#5eead4", "#93c5fd", "#fca5a5", "#e9d5ff", "#fdba74"];

export function BusinessForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createBusiness, undefined);

  return (
    <div className="h-fit rounded-xl border border-line bg-soft p-5">
      <div className="flex items-center gap-2">
        <Plus className="size-4 text-signal" />
        <h2 className="text-sm font-medium">Add a business</h2>
      </div>
      <p className="mt-1.5 text-xs text-mute">
        The agent reads this every time it works, so be specific about what it is allowed to do.
      </p>

      <form action={formAction} className="mt-4 space-y-3.5">
        <label className="block">
          <span className="mb-1.5 block text-xs text-mute">Name</span>
          <input name="name" required placeholder="7H Music Group" className={input} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs text-mute">What it does</span>
          <textarea
            name="brief"
            rows={2}
            placeholder="A Kampala label and artist-services house: 4 artists, distribution, publishing, booking."
            className={`${input} resize-none`}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs text-mute">Standing instructions</span>
          <textarea
            name="instructions"
            rows={4}
            placeholder={"Always use the catalogue CSV in this folder.\nNever email artists without asking me first.\nPayouts go out on the 15th."}
            className={`${input} resize-none`}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs text-mute">Workspace folder (optional)</span>
          <input
            name="workspace_path"
            placeholder="~/Businesses/7h-music-group"
            className={input}
          />
          <span className="mt-1.5 block text-[11px] text-white/30">
            Leave empty and the bridge creates one under ~/7even-workspaces.
          </span>
        </label>

        <fieldset>
          <legend className="mb-1.5 block text-xs text-mute">Autonomy</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "ask", label: "Ask before acting", hint: "approvals on anything risky" },
              { value: "auto", label: "Act freely", hint: "no approval prompts" },
            ].map((option, index) => (
              <label
                key={option.value}
                className="cursor-pointer rounded-lg border border-line bg-ink px-3 py-2.5 transition has-[:checked]:border-signal/60 has-[:checked]:bg-signal/[0.06]"
              >
                <input
                  type="radio"
                  name="autonomy"
                  value={option.value}
                  defaultChecked={index === 0}
                  className="sr-only"
                />
                <span className="block text-xs font-medium">{option.label}</span>
                <span className="mt-0.5 block text-[10px] text-white/35">{option.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <span className="mb-1.5 block text-xs text-mute">Colour</span>
          <div className="flex gap-2">
            {COLOURS.map((colour, index) => (
              <label key={colour} className="cursor-pointer">
                <input
                  type="radio"
                  name="colour"
                  value={colour}
                  defaultChecked={index === 0}
                  className="peer sr-only"
                />
                <span
                  className="block size-6 rounded-full ring-2 ring-transparent transition peer-checked:ring-white/70"
                  style={{ backgroundColor: colour }}
                />
              </label>
            ))}
          </div>
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
          Add business
        </button>
      </form>
    </div>
  );
}
