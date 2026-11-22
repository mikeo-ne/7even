import Link from "next/link";
import type { Approval, Business } from "@7even/core";
import { createClient } from "@/lib/supabase/server";
import { Empty, PageHeader, relativeTime } from "@/lib/ui";
import { decideApproval } from "../actions";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const [approvals, businesses] = await Promise.all([
    supabase.from("approvals").select("*").order("created_at", { ascending: false }).limit(80),
    supabase.from("businesses").select("id, name"),
  ]);

  const list = (approvals.data as Approval[]) ?? [];
  const pending = list.filter((a) => a.status === "pending");
  const decided = list.filter((a) => a.status !== "pending");
  const businessName = (id: string | null) =>
    ((businesses.data as Pick<Business, "id" | "name">[]) ?? []).find((b) => b.id === id)?.name ??
    "General";

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Decisions"
        title="Approvals"
        description="Nothing irreversible happens without landing here first — money out, mail sent, files deleted."
      />

      <section className="space-y-3">
        <h2 className="text-xs font-semibold tracking-[0.18em] text-signal uppercase">
          Waiting on you ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <div className="rounded-xl border border-line">
            <Empty text="Nothing to decide. When the agent wants to send or spend, it will appear here." />
          </div>
        ) : (
          <ul className="space-y-3">
            {pending.map((approval) => (
              <li key={approval.id} className="rounded-xl border border-amber-400/25 bg-amber-400/[0.04] p-5">
                <p className="text-sm font-medium text-amber-100">{approval.action}</p>
                {approval.detail && (
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-white/60">
                    {approval.detail}
                  </p>
                )}
                <p className="mt-3 text-[11px] text-white/30">
                  {businessName(approval.business_id)} · {relativeTime(approval.created_at)}
                  {approval.task_id && (
                    <>
                      {" · "}
                      <Link
                        href={`/app/tasks/${approval.task_id}`}
                        className="text-signal hover:text-signal-dim"
                      >
                        see the task
                      </Link>
                    </>
                  )}
                </p>

                <div className="mt-4 flex gap-2">
                  <form action={decideApproval}>
                    <input type="hidden" name="approval_id" value={approval.id} />
                    <input type="hidden" name="decision" value="approve" />
                    <button className="rounded-full bg-signal px-4 py-2 text-xs font-semibold text-ink transition hover:bg-signal-dim">
                      Approve
                    </button>
                  </form>
                  <form action={decideApproval}>
                    <input type="hidden" name="approval_id" value={approval.id} />
                    <input type="hidden" name="decision" value="reject" />
                    <button className="rounded-full border border-line px-4 py-2 text-xs font-medium text-mute transition hover:bg-white/5 hover:text-rose-300">
                      Reject
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {decided.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-line">
          <h2 className="border-b border-line bg-soft px-5 py-3.5 text-sm font-medium">History</h2>
          <ul className="divide-y divide-line">
            {decided.map((approval) => (
              <li key={approval.id} className="flex items-start justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-white/75">{approval.action}</p>
                  <p className="mt-0.5 text-[11px] text-white/30">
                    {businessName(approval.business_id)} · {relativeTime(approval.decided_at)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset ${
                    approval.status === "approved"
                      ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20"
                      : "bg-rose-500/10 text-rose-300 ring-rose-500/25"
                  }`}
                >
                  {approval.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
