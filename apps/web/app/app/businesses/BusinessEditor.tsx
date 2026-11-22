"use client";

import { useActionState, useState } from "react";
import { ChevronDown, Loader2, Save } from "lucide-react";
import type { Business } from "@7even/core";
import { updateBusiness, type ActionState } from "../actions";

const input =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-xs text-white placeholder:text-white/25 outline-none transition focus:border-signal/60 focus:ring-2 focus:ring-signal/15";

const COLOURS = ["#d7ff3e", "#5eead4", "#93c5fd", "#fca5a5", "#e9d5ff", "#fdba74", "#f5c542"];

export function BusinessEditor({ business }: { business: Business }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateBusiness,
    undefined,
  );

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 text-[11px] text-white/35 transition hover:text-white/70"
      >
        <ChevronDown className={`size-3 transition ${open ? "rotate-180" : ""}`} />
        {open ? "close" : "edit profile"}
      </button>

      {open && (
        <form action={formAction} className="mt-3 space-y-3 rounded-lg border border-line bg-ink/60 p-3.5">
          <input type="hidden" name="id" value={business.id} />

          <label className="block">
            <span className="mb-1 block text-[11px] text-mute">Name</span>
            <input name="name" defaultValue={business.name} required className={input} />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] text-mute">What it does</span>
            <textarea
              name="brief"
              rows={5}
              defaultValue={business.brief ?? ""}
              className={`${input} resize-y leading-relaxed`}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] text-mute">Standing instructions</span>
            <textarea
              name="instructions"
              rows={8}
              defaultValue={business.instructions ?? ""}
              className={`${input} resize-y leading-relaxed`}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] text-mute">Workspace folder</span>
            <input
              name="workspace_path"
              defaultValue={business.workspace_path ?? ""}
              placeholder="~/.7even/workspaces/…"
              className={input}
            />
          </label>

          <fieldset>
            <legend className="mb-1 block text-[11px] text-mute">Autonomy</legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "ask", label: "Ask before acting" },
                { value: "auto", label: "Act freely" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="cursor-pointer rounded-lg border border-line bg-soft px-2.5 py-2 transition has-[:checked]:border-signal/60 has-[:checked]:bg-signal/[0.06]"
                >
                  <input
                    type="radio"
                    name="autonomy"
                    value={option.value}
                    defaultChecked={(business.autonomy ?? "ask") === option.value}
                    className="sr-only"
                  />
                  <span className="block text-[11px] font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <span className="mb-1 block text-[11px] text-mute">Colour</span>
            <div className="flex gap-2">
              {COLOURS.map((colour) => (
                <label key={colour} className="cursor-pointer">
                  <input
                    type="radio"
                    name="colour"
                    value={colour}
                    defaultChecked={business.colour === colour}
                    className="peer sr-only"
                  />
                  <span
                    className="block size-5 rounded-full ring-2 ring-transparent transition peer-checked:ring-white/70"
                    style={{ backgroundColor: colour }}
                  />
                </label>
              ))}
            </div>
          </div>

          {state?.error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-300">
              {state.error}
            </p>
          )}
          {state?.ok && (
            <p className="rounded-lg border border-signal/30 bg-signal/10 px-2.5 py-1.5 text-[11px] text-signal">
              {state.ok}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-1.5 rounded-lg bg-signal px-3 py-1.5 text-[11px] font-semibold text-ink transition hover:bg-signal/90 disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
            Save profile
          </button>
        </form>
      )}
    </div>
  );
}
