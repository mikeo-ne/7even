"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import type { FormState } from "../releases/actions";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-lime/60 focus:ring-2 focus:ring-lime/15";

export function ArtistForm({
  action,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="mt-4 space-y-3.5">
      <label className="block">
        <span className="mb-1.5 block text-xs text-mute">Artist name</span>
        <input name="name" required placeholder="Ama K" className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs text-mute">Short bio</span>
        <textarea
          name="bio"
          rows={3}
          placeholder="Afro-fusion singer from Kampala."
          className={`${inputCls} resize-none`}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs text-mute">Photo URL</span>
        <input name="image_url" type="url" placeholder="https://…" className={inputCls} />
      </label>

      {state?.error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-lime-dim disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Add to roster
      </button>
    </form>
  );
}
