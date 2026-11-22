"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createRelease, type FormState } from "../actions";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-lime/60 focus:ring-2 focus:ring-lime/15";

export function NewReleaseForm({ artists }: { artists: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createRelease, undefined);
  const [tracks, setTracks] = useState<string[]>([""]);

  return (
    <form action={formAction} className="space-y-5">
      <section className="rounded-xl border border-line bg-ink-soft p-5 sm:p-6">
        <h2 className="text-sm font-medium">Release details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs text-mute">Title</span>
            <input name="title" required placeholder="Night Shift" className={inputCls} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-mute">Artist</span>
            <select name="artist_id" className={inputCls} defaultValue="">
              <option value="">Unassigned</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            {artists.length === 0 && (
              <span className="mt-1.5 block text-[11px] text-white/30">
                No artists yet — you can add them from the Artists page first.
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-mute">Format</span>
            <select name="type" className={inputCls} defaultValue="single">
              <option value="single">Single</option>
              <option value="ep">EP</option>
              <option value="album">Album</option>
              <option value="mixtape">Mixtape</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-mute">Genre</span>
            <input name="genre" placeholder="Afrobeats" className={inputCls} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-mute">Release date</span>
            <input name="release_date" type="date" className={`${inputCls} [color-scheme:dark]`} />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs text-mute">Artwork URL</span>
            <input
              name="artwork_url"
              type="url"
              placeholder="https://…/cover.jpg"
              className={inputCls}
            />
            <span className="mt-1.5 block text-[11px] text-white/30">
              Square, at least 3000×3000 px for store delivery.
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-ink-soft p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Tracks</h2>
          <span className="text-[11px] text-mute">{tracks.length} track{tracks.length === 1 ? "" : "s"}</span>
        </div>
        <div className="mt-4 space-y-2.5">
          {tracks.map((t, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="w-5 text-center text-xs text-white/25">{i + 1}</span>
              <input
                name="track_title"
                value={t}
                onChange={(e) =>
                  setTracks((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                }
                placeholder={`Track ${i + 1} title`}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setTracks((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={tracks.length === 1}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-mute transition hover:bg-white/5 hover:text-rose-300 disabled:opacity-30"
                title="Remove track"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setTracks((prev) => [...prev, ""])}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium transition hover:bg-white/5"
        >
          <Plus className="size-3.5" />
          Add track
        </button>
      </section>

      {state?.error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-lime-dim disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save draft
        </button>
        <span className="text-xs text-mute">Saved releases start as drafts.</span>
      </div>
    </form>
  );
}
