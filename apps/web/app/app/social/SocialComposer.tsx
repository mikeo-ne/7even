"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import type { Business } from "@7even/core";
import { queueTask, type ActionState } from "../actions";

const input =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-xs text-white placeholder:text-white/25 outline-none transition focus:border-signal/60 focus:ring-2 focus:ring-signal/15";

export function SocialComposer({ businesses }: { businesses: Business[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(queueTask, undefined);

  return (
    <div className="rounded-xl border border-line bg-soft p-5">
      <h2 className="text-sm font-medium">Ask for a post</h2>
      <p className="mt-1.5 text-xs text-mute">
        The agent reads that business&apos;s channel file, drafts the copy, and waits for you before
        anything is published.
      </p>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="title" value="Social: drafted post" />

        <label className="block">
          <span className="mb-1 block text-[11px] text-mute">Business</span>
          <select name="business_id" className={input} defaultValue={businesses[0]?.id ?? ""}>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] text-mute">What is the post for?</span>
          <textarea
            name="prompt"
            rows={4}
            required
            placeholder={
              "Announce Mr Fallback's Kiwatto — one Instagram carousel and one X post.\nGive me copy, alt text and hashtags. Do not publish."
            }
            className={`${input} resize-y leading-relaxed`}
          />
        </label>

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
          className="flex items-center gap-1.5 rounded-lg bg-signal px-3 py-2 text-xs font-semibold text-ink transition hover:bg-signal/90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
          Queue it
        </button>
      </form>
    </div>
  );
}
