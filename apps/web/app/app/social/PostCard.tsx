"use client";

import { useState } from "react";
import { CalendarClock, Check, Clock, RotateCcw, X } from "lucide-react";
import type { Post } from "@7even/core";
import { decidePost, schedulePost } from "../actions";

const LIMITS: Record<string, number> = {
  x: 280,
  instagram: 2200,
  tiktok: 2200,
  youtube: 5000,
  facebook: 63206,
  linkedin: 3000,
};

const TONE: Record<Post["status"], string> = {
  draft: "text-white/40",
  pending_approval: "text-amber-300",
  approved: "text-signal",
  publishing: "text-sky-300",
  published: "text-emerald-300",
  failed: "text-rose-300",
  cancelled: "text-white/25",
};

const LABEL: Record<Post["status"], string> = {
  draft: "draft",
  pending_approval: "needs you",
  approved: "approved",
  publishing: "publishing",
  published: "published",
  failed: "failed",
  cancelled: "cancelled",
};

export function PostCard({ post, businessName, colour }: { post: Post; businessName: string; colour: string }) {
  const [preview, setPreview] = useState(false);
  const limit = LIMITS[post.platform] ?? 2200;
  const length = [...post.caption].length;
  const over = length > limit;
  const when = post.scheduled_for
    ? new Date(post.scheduled_for).toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Kampala",
      })
    : "no slot";

  return (
    <li className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: colour }} />
            <span className="font-mono text-[10px] text-white/60">
              {post.platform} {post.account_handle}
            </span>
            {post.account_role === "artist" && (
              <span className="rounded bg-sky-400/10 px-1 py-0.5 text-[9px] text-sky-300">artist</span>
            )}
            {post.account_role === "owner" && (
              <span className="rounded bg-violet-400/10 px-1 py-0.5 text-[9px] text-violet-300">
                your account
              </span>
            )}
            <span className="text-[10px] text-white/25">{businessName}</span>
          </div>
          <p className="mt-1.5 text-[10px] text-white/30">
            <Clock className="mr-1 inline size-3" />
            {when} EAT · {post.format}
            <span className={over ? "ml-2 text-rose-300" : "ml-2"}>
              {length}/{limit}
            </span>
          </p>
        </div>
        <span className={`shrink-0 text-[10px] font-medium ${TONE[post.status]}`}>
          {LABEL[post.status]}
        </span>
      </div>

      {preview ? (
        <div className="mt-3 rounded-lg border border-line bg-white p-4 text-[13px] leading-relaxed text-black">
          <p className="whitespace-pre-wrap">{post.caption}</p>
          {post.hashtags.length > 0 && (
            <p className="mt-2 text-[#00376b]">{post.hashtags.join(" ")}</p>
          )}
          {post.link && <p className="mt-1 break-all text-[#00376b]">{post.link}</p>}
        </div>
      ) : (
        <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-white/70">
          {post.caption}
        </p>
      )}

      {post.error && (
        <p className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-300">
          {post.error}
        </p>
      )}

      {post.alt_text && (
        <p className="mt-1.5 text-[10px] text-white/25">alt: {post.alt_text}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPreview((value) => !value)}
          className="rounded-full border border-line px-2.5 py-1 text-[10px] text-white/50 transition hover:text-white"
        >
          {preview ? "hide preview" : "preview"}
        </button>

        {post.status === "pending_approval" && (
          <>
            <form action={decidePost}>
              <input type="hidden" name="post_id" value={post.id} />
              <input type="hidden" name="decision" value="approve" />
              <button className="flex items-center gap-1 rounded-full bg-signal px-2.5 py-1 text-[10px] font-semibold text-ink transition hover:bg-signal-dim">
                <Check className="size-3" /> Approve
              </button>
            </form>
            <form action={decidePost}>
              <input type="hidden" name="post_id" value={post.id} />
              <input type="hidden" name="decision" value="cancel" />
              <button className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[10px] text-white/50 transition hover:text-rose-300">
                <X className="size-3" /> Drop
              </button>
            </form>
          </>
        )}

        {(post.status === "pending_approval" || post.status === "approved") && (
          <form action={schedulePost} className="flex items-center gap-1">
            <input type="hidden" name="post_id" value={post.id} />
            <input
              type="datetime-local"
              name="scheduled_for"
              defaultValue={post.scheduled_for?.slice(0, 16) ?? ""}
              className="rounded-full border border-line bg-ink px-2 py-1 text-[10px] text-white/60 outline-none"
            />
            <button className="flex items-center gap-1 rounded-full border border-line px-2 py-1 text-[10px] text-white/50 transition hover:text-signal">
              <CalendarClock className="size-3" /> Set
            </button>
          </form>
        )}

        {post.status === "failed" && (
          <form action={decidePost}>
            <input type="hidden" name="post_id" value={post.id} />
            <input type="hidden" name="decision" value="hold" />
            <button className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[10px] text-white/50 transition hover:text-white">
              <RotateCcw className="size-3" /> Back to review
            </button>
          </form>
        )}
      </div>
    </li>
  );
}
