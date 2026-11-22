import { Download, Wallet } from "lucide-react";
import { getEarnings, getLabel, getPayouts, getStores } from "@/lib/queries";
import { compact, money } from "@/lib/types";
import { Empty, PageHeader } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  const { label } = await getLabel();
  if (!label) return <Empty text="No label workspace on this account." />;

  const [earnings, payouts, stores] = await Promise.all([
    getEarnings(label.id, 1000),
    getPayouts(label.id),
    getStores(),
  ]);

  const totalCents = earnings.reduce((a, e) => a + Number(e.amount_cents), 0);
  const totalStreams = earnings.reduce((a, e) => a + Number(e.streams), 0);
  const paidCents = payouts
    .filter((p) => p.status === "paid")
    .reduce((a: number, p: { amount_cents: number }) => a + Number(p.amount_cents), 0);
  const available = totalCents - paidCents;

  const byStore = stores
    .map((s) => ({
      ...s,
      cents: earnings
        .filter((e) => e.stores?.name === s.name)
        .reduce((a, e) => a + Number(e.amount_cents), 0),
      streams: earnings
        .filter((e) => e.stores?.name === s.name)
        .reduce((a, e) => a + Number(e.streams), 0),
    }))
    .sort((a, b) => b.cents - a.cents);
  const peak = Math.max(1, ...byStore.map((s) => s.cents));

  const byPeriod = Object.entries(
    earnings.reduce<Record<string, { cents: number; streams: number }>>((acc, e) => {
      acc[e.period] ??= { cents: 0, streams: 0 };
      acc[e.period].cents += Number(e.amount_cents);
      acc[e.period].streams += Number(e.streams);
      return acc;
    }, {}),
  )
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Money"
        title="Earnings & payouts"
        description="What each store paid, and what is ready to withdraw."
      />

      <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
        {[
          ["Available", money(available), "Ready to withdraw"],
          ["Lifetime", money(totalCents), `${compact(totalStreams)} streams`],
          ["Paid out", money(paidCents), `${payouts.filter((p) => p.status === "paid").length} payouts`],
        ].map(([k, v, hint]) => (
          <div key={k} className="bg-ink-soft p-5">
            <p className="text-xs text-mute">{k}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{v}</p>
            <p className="mt-1 text-[11px] text-white/30">{hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-ink-soft p-5">
          <h2 className="text-sm font-medium">Revenue by store</h2>
          <div className="mt-5 space-y-3.5">
            {byStore.map((s) => (
              <div key={s.slug}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-white/80">{s.name}</span>
                  <span className="tabular-nums text-mute">{money(s.cents)}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-lime/60"
                    style={{ width: `${Math.max(1, (s.cents / peak) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {byStore.every((s) => s.cents === 0) && (
              <p className="text-xs text-white/30">No store revenue recorded yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-line bg-ink-soft p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Statements</h2>
            <span className="text-[11px] text-mute">Monthly</span>
          </div>
          {byPeriod.length === 0 ? (
            <p className="mt-5 text-xs text-white/30">No statements yet.</p>
          ) : (
            <table className="mt-4 w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] tracking-wide text-white/30 uppercase">
                  <th className="pb-2 font-medium">Period</th>
                  <th className="pb-2 text-right font-medium">Streams</th>
                  <th className="pb-2 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {byPeriod.map(([period, v]) => (
                  <tr key={period}>
                    <td className="py-2.5 text-white/80">{period}</td>
                    <td className="py-2.5 text-right tabular-nums text-mute">
                      {v.streams.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-lime">
                      {money(v.cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-line">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-ink-soft px-5 py-3.5">
          <h2 className="text-sm font-medium">Payout history</h2>
          <button
            disabled
            title="Payouts open once you clear the $50 threshold"
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[11px] font-medium text-mute opacity-60"
          >
            <Wallet className="size-3.5" />
            Request payout
          </button>
        </div>
        {payouts.length === 0 ? (
          <Empty
            text={`Nothing paid out yet. Withdrawals unlock at $50 — you are at ${money(available)}.`}
          />
        ) : (
          <ul className="divide-y divide-line">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
                <div>
                  <p className="tabular-nums">{money(Number(p.amount_cents))}</p>
                  <p className="text-[11px] text-white/30">
                    {p.method} ·{" "}
                    {new Date(p.paid_at ?? p.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset ${
                    p.status === "paid"
                      ? "bg-lime/10 text-lime ring-lime/20"
                      : "bg-amber-400/10 text-amber-300 ring-amber-400/20"
                  }`}
                >
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {earnings.length > 0 && (
        <p className="flex items-center gap-1.5 text-[11px] text-white/30">
          <Download className="size-3.5" />
          Detailed CSV exports land here once statements sync from the stores.
        </p>
      )}
    </div>
  );
}
