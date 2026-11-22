"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { updateReleaseStatus } from "../actions";

export function StatusControls({ releaseId, status }: { releaseId: string; status: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const run = (next: string) =>
    start(async () => {
      await updateReleaseStatus(releaseId, next);
      router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "draft" && (
        <button
          onClick={() => run("in_review")}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs font-medium transition hover:bg-white/5 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          Submit for review
        </button>
      )}
      {status === "in_review" && (
        <button
          onClick={() => run("delivered")}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-lime px-4 py-2 text-xs font-semibold text-ink transition hover:bg-lime-dim disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          Deliver to stores
        </button>
      )}
      {status === "delivered" && (
        <button
          onClick={() => run("live")}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs font-medium transition hover:bg-white/5 disabled:opacity-60"
        >
          Mark as live
        </button>
      )}
      {status === "live" && (
        <button
          onClick={() => run("takedown")}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs font-medium text-mute transition hover:bg-white/5 hover:text-rose-300 disabled:opacity-60"
        >
          Request takedown
        </button>
      )}
      {status === "takedown" && (
        <button
          onClick={() => run("delivered")}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs font-medium transition hover:bg-white/5 disabled:opacity-60"
        >
          Re-deliver
        </button>
      )}
    </div>
  );
}
